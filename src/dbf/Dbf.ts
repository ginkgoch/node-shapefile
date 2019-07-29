import fs from 'fs'
import _ from 'lodash'
import { StreamReader } from 'ginkgoch-stream-io'
import Openable from '../base/StreamOpenable'
import Validators from '../shared/Validators'
import DbfIterator from './DbfIterator'
import DbfHeader from './DbfHeader'
import DbfField from './DbfField'
import DbfRecord from './DbfRecord'
import IQueryFilter from '../shared/IQueryFilter';

export default class Dbf extends Openable {
    filePath: string
    _fd?: number
    _header?: DbfHeader
    _flag: string

    constructor(filePath: string, flag = 'rs') {
        super();
        this.filePath = filePath;
        this._flag = flag;
    }

    /**
     * @override
     */
    async _open() {
        this._fd = fs.openSync(this.filePath, this._flag, fs.constants.S_IROTH);
        this._header = this._readHeader();
        await Promise.resolve();
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
    async _close() {
        fs.closeSync(this.__fd);
        this._fd = undefined;
    }

    _readHeader(): DbfHeader {
        const header = new DbfHeader();
        header.read(this.__fd);
        return header;
    }

    /**
     * Gets Dbase record at a specific row index.
     * @param id Index of the record. Starts from 1.
     * @param fields The fields to fetch in the row.
     */
    async get(id: number, fields?: string[]): Promise<DbfRecord> {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(id);

        const offset = this._getOffsetById(id);
        const iterator = await this._getRecordIterator(offset, offset + this.__header.recordLength);
        iterator.fields = fields;
        iterator._index = id - 1;

        const record = await iterator.next();
        return record.value;
    }

    async iterator(fields?: string[]) {
        Validators.checkIsOpened(this.isOpened);

        const iterator = await this._getRecordIterator(this.__header.headerLength);
        iterator.fields = fields;
        return iterator;
    }

    /**
     *
     * @param start
     * @param end
     * @returns {Promise<DbfIterator>}
     * @private
     */
    async _getRecordIterator(start?: number, end?: number): Promise<DbfIterator> {
        const option = this._getStreamOption(start, end);
        const stream = fs.createReadStream(this.filePath, option);
        const sr = new StreamReader(stream);
        await sr.open();
        return new DbfIterator(sr, this.__header);
    }

    /**
     * @param {Object.<{ from: number|undefined, limit: number|undefined, fields: Array.<string>|undefined }>} filter
     * @returns {Array<DbfRecord>}}
     */
    async records(filter?: IQueryFilter): Promise<Array<DbfRecord>> {
        const option = this._getStreamOption(this.__header.headerLength);
        const stream = fs.createReadStream(this.filePath, option);
        const records = new Array<DbfRecord>();

        const filterFields = filter && filter.fields;
        const filterOptions = this._normalizeFilter(filter);
        const to = filterOptions.from + filterOptions.limit;

        return new Promise(resolve => {
            stream.on('readable', () => {
                const recordLength = this.__header.recordLength;
                
                let index = 0;
                let buffer = stream.read(recordLength);
                while (null !== buffer) {
                    index++;
                    if (buffer.length < recordLength) {
                        break;
                    }

                    const currentBuff = buffer;
                    buffer = stream.read(recordLength);

                    if (index < filterOptions.from || index >= to) {
                        continue;
                    }

                    const record = DbfIterator._readRecord(currentBuff, this.__header, filterFields);
                    record.id = index;
                    records.push(record);
                }
            }).on('end', () => {
                resolve(records);
            });
        });
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
    pushAll(records: Array<DbfRecord|any>) {
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
    removeAt(id: number) {
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
    recoverAt(id: number) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(id);

        const position = this._getOffsetById(id);
        const buff = Buffer.from(' ');
        fs.writeSync(<number>this._fd, buff, 0, 1, position);
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
};