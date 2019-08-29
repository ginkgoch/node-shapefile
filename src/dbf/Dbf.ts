import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import DbfField from './DbfField';
import DbfHeader from './DbfHeader';
import DbfRecord from './DbfRecord';
import DbfIterator from './DbfIterator';
import OpenerSync from '../base/OpenerSync';
import Validators from '../shared/Validators';
import IQueryFilter from '../shared/IQueryFilter';
import { FileStream } from 'ginkgoch-filestream';
import FilterUtils from '../shared/FilterUtils';
import DbfFieldEditCache from './DbfFieldEditCache';

export default class Dbf extends OpenerSync {
    filePath: string;
    _fd?: number;
    _header?: DbfHeader;
    _flag: string;
    _fieldEditCache: DbfFieldEditCache;

    constructor(filePath: string, flag = 'rs') {
        super();
        this.filePath = filePath;
        this._flag = flag;
        this._fieldEditCache = new DbfFieldEditCache();
    }

    /**
     * @override
     */
    _open() {
        this._fd = fs.openSync(this.filePath, this._flag, fs.constants.S_IROTH);
        this._header = this._readHeader();
    }

    fields(detail: boolean = false): DbfField[] | string[] {
        let fields = _.cloneDeep(this.__header.fields);
        if (!detail) {
            return fields.map(f => f.name);
        } else {
            return fields;
        }
    }

    /**
     * @override
     */
    _close() {
        fs.closeSync(this.__fd);
        this._fd = undefined;
    }

    _readHeader(): DbfHeader {
        const header = new DbfHeader();
        header.read(this.__fd);
        return header;
    }

    /**
     * Gets D-base record at a specific row index.
     * @param id Index of the record. Starts from 1.
     * @param fields The fields to fetch in the row.
     */
    get(id: number, fields?: string[] | 'all' | 'none'): DbfRecord {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(id);

        const iterator = new DbfIterator(this.__fd, this.__header, { from: id, limit: 1, fields });
        const record = iterator.next();
        return record.value;
    }

    iterator(filter?: IQueryFilter) {
        Validators.checkIsOpened(this.isOpened);

        return new DbfIterator(this.__fd, this.__header, filter);
    }

    /**
     * @param {Object.<{ from: number|undefined, limit: number|undefined, fields: Array.<string>|undefined }>} filter
     * @returns {Array<DbfRecord>}}
     */
    records(filter?: IQueryFilter): Array<DbfRecord> {
        const records = new Array<DbfRecord>();

        const filterOptions = FilterUtils.normalizeFilter(filter, this._fieldNames.bind(this));
        const to = filterOptions.from + filterOptions.limit;

        if (filterOptions.fields && filterOptions.fields.length === 0) {
            return records;
        }

        const recordLength = this.__header.recordLength;
        let index = filterOptions.from;
        const stream = new FileStream(this.__fd);
        const position = this.__header.headerLength + recordLength * (filterOptions.from - 1);
        stream.seek(position);
        while (index < to) {
            const buff = stream.read(recordLength);
            if (buff.length !== recordLength) {
                break;
            }

            const record = DbfIterator._readRecord(buff, this.__header, filterOptions.fields);
            record.id = index;
            records.push(record);

            index++;
        }

        return records;
    }

    /**
     *
     * @param {string} filePath
     * @param {Array<DbfField>} fields
     * @returns {Dbf}
     * @static
     */
    static createEmpty(filePath: string, fields: DbfField[]): Dbf {
        const header = DbfHeader.createEmptyHeader(fields);
        const fd = fs.openSync(filePath, 'w');
        header.write(fd);
        fs.closeSync(fd);

        const dbfFile = new Dbf(filePath, 'rs+');
        return dbfFile;
    }

    push(props: any): void
    push(props: Map<string, any>): void
    /**
     * Push single row values into memory. Call flush() to persistent into file.
     * @param {DbfRecord} record The one record to push.
     * @example
     * dbf.pushRecord({ rec:1, name:'china' });
     */
    push(record: DbfRecord): void
    push(param: DbfRecord | Map<string, any> | any): void {
        let record: DbfRecord;

        if (param instanceof Map) {
            record = new DbfRecord();
            (<Map<string, any>>param).forEach((v, k, m) => {
                record.values.set(k, v);
            });
        } else if (param instanceof DbfRecord) {
            record = param as DbfRecord;
        } else {
            record = new DbfRecord();
            Object.keys(param).forEach((k, i, arr) => {
                record.values.set(k, param[k]);
            });
        }

        record.id = -1;
        this._flush(record);
        this.__header.write(this.__fd);
    }

    /**
     * Push multiple rows' values into memory. Call flush() to persistent into file.
     * @param {Array<Object>} records The field values array.
     * @example
     * dbf.pushRows([{ rec:1, name:'china'}, {rec:2, name:'usa'}]);
     */
    pushAll(records: Array<DbfRecord | any>) {
        //TODO: update docs around...
        records.forEach(r => {
            let record: DbfRecord;
            if (r instanceof DbfRecord) {
                record = r as DbfRecord;
            } else {
                record = new DbfRecord(r);
            }

            record.id = -1;
            this._flush(record);
        });

        if (records.length > 0) {
            this.__header.write(this.__fd);
        }
    }

    /**
     * Update a specific row values. Call flush() to persistent into file.
     * @param {Object} record Record to update.
     * @example
     * const record = {id: 0, values: {rec: 1, name: 'usa'}};
     * dbf.updateRow(record);
     */
    update(record: DbfRecord) {
        this._flush(record);
    }

    /**
     * Update a specific row values. Call flush() to persistent into file.
     * @param {Array<DbfRecord>} records Records to update.
     * @example
     * const records = [{id: 0, values: {rec: 1, name: 'usa'}}];
     * dbf.updateRows(records);
     */
    updateAll(records: DbfRecord[]) {
        records.forEach(r => this.update(r));
    }

    /**
     *
     * @param {DbfRecord} record
     * @private
     */
    _flush(record: DbfRecord) {
        record.header = this._header;

        const buff = Buffer.alloc(this.__header.recordLength);
        record.write(buff);

        let recordId = record.id === -1 ? this.__header.recordCount + 1 : record.id;
        let position = this._getOffsetById(recordId);
        fs.writeSync(this.__fd, buff, 0, buff.length, position);

        if (record.id === -1) {
            this.__header.recordCount++;
        }
    }

    /**
     * Remove record at index.
     * @param {number} id The record id to delete. Start from 1.
     */
    remove(id: number) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(id);

        const position = this._getOffsetById(id);
        const buff = Buffer.from('*');
        fs.writeSync(this.__fd, buff, 0, 1, position);
    }

    /**
     * Recover the deleted record by id. Edited record doesn't support.
     * @param {number} id The record id to delete. Start from 1.
     */
    recover(id: number) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(id);

        const position = this._getOffsetById(id);
        const buff = Buffer.from(' ');
        fs.writeSync(<number>this._fd, buff, 0, 1, position);
    }

    pushField(field: DbfField) {
        this._fieldEditCache.pushField(field);
    }

    removeField(fieldName: string) {
        this._fieldEditCache.removeField(fieldName);
    }

    updateField(fieldName: string, newField: DbfField) {
        this._fieldEditCache.updateField(fieldName, newField);
    }

    flushFields() {
        const sizeChangedFields = new Array<DbfField>();
        this._fieldEditCache.updatedFields.forEach((v, k) => {
            let originField = this.__header.fields.find(f => f.name === k) as DbfField;
            originField.name = v.name;

            if (originField.length !== v.length || originField.type !== v.type) {
                sizeChangedFields.push(v);
            }
        });

        this.__header.write(this.__fd);

        if (this._fieldEditCache.addedFields.length > 0 ||
            this._fieldEditCache.removedFields.length > 0 ||
            sizeChangedFields.length > 0) {
            const newFields = this._newFields(this._fieldEditCache, sizeChangedFields);

            const sourceFilePath = this.filePath;
            const targetFilePath = this._migrateToTempDbf(newFields);

            this.close();
            try {
                fs.copyFileSync(targetFilePath, sourceFilePath);
            } finally {
                this._fieldEditCache.clear();
                if (fs.existsSync(targetFilePath)) {
                    fs.unlinkSync(targetFilePath);
                }

                this.open();
            }
        }
    }

    private _migrateToTempDbf(newFields: DbfField[]) {
        const tempFilePath = Dbf._tempFilePath(this.filePath);
        const tempDbf = Dbf.createEmpty(tempFilePath, newFields);
        tempDbf.open();

        const iterator = this.iterator();
        let record = iterator.next();
        while (!iterator.done) {
            if (record.hasValue) {
                const sourceRecord = record.value;
                const tempRecord = new DbfRecord(newFields);
                (sourceRecord.header as DbfHeader).fields.forEach(sourceField => {
                    if (newFields.some(f => f.name === sourceField.name)) {
                        tempRecord.values.set(sourceField.name, sourceRecord.values.get(sourceField.name));
                        tempDbf.push(tempRecord);
                    }
                });
            }
            
            record = iterator.next();
        }

        tempDbf.close();
        return tempFilePath;
    }

    private static _tempFilePath(filePath: string) {
        const folder = path.dirname(filePath);
        const ext = path.extname(filePath);
        const name = path.basename(filePath, ext);

        let newFilePath = `${ folder }/${ name }_tmp${ ext }`;
        let i = 1;
        while (fs.existsSync(newFilePath)) {
            newFilePath = `${ folder }/${ name }_tmp_${ i }${ ext }`;
            i++;
        }

        return newFilePath;
    }

    private _newFields(fieldEditCache: DbfFieldEditCache, sizeChangedFields: DbfField[]) {
        const addedFieldNames = fieldEditCache.addedFields.map(f => f.name);
        const sizeChangedFieldNames = sizeChangedFields.map(f => f.name);
        const newFields = new Array<DbfField>();

        const predict = (field: DbfField) => (f: string) => f === field.name;

        this.__header.fields.forEach(f => {
            if (!sizeChangedFieldNames.some(predict(f)) &&
                !addedFieldNames.some(predict(f)) &&
                !fieldEditCache.removedFields.some(predict(f))) {
                const newField = new DbfField(f.name, f.type, f.length, f.decimal);
                newFields.push(newField);
            }
        });

        fieldEditCache.addedFields.concat(sizeChangedFields).forEach(f => newFields.push(f));

        return newFields;
    }

    /**
     * Open file for editing. If it is opened, it will be closed and reopen with rs+ flag.
     */
    openForEdit() {
        if (!this._fd) {
            fs.closeSync(this.__fd);
            this._fd = undefined;
        }

        this._fd = fs.openSync(this.filePath, 'rs+');
    }

    get __fd() {
        return <number>this._fd;
    }

    get __header() {
        return <DbfHeader>this._header;
    }

    private _getOffsetById(id: number): number {
        return this.__header.headerLength + (id - 1) * this.__header.recordLength;
    }

    private _fieldNames() {
        return this.__header.fields.map(f => f.name);
    }
};