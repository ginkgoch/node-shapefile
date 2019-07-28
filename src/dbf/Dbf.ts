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

    async get(id: number, fields?: string[]): Promise<DbfRecord> {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(id);

        const offset = this.__header.headerLength + this.__header.recordLength * id;
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
        const filterStream = this._normalizeFilter(filter);
        const to = filterStream.from + filterStream.limit;

        return new Promise(resolve => {
            let index = -1;
            stream.on('readable', () => {
                const recordLength = this.__header.recordLength;

                let buffer = stream.read(recordLength);
                while (null !== buffer) {
                    index++;
                    if (buffer.length < recordLength) {
                        break;
                    }

                    const currentBuff = buffer;
                    buffer = stream.read(recordLength);

                    if (index < filterStream.from || index >= to) {
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

    /**
     * Push single row values into memory. Call flush() to persistent into file.
     * @param {DbfRecord} record The one record to push.
     * @example
     * dbf.pushRecord({ rec:1, name:'china' });
     */
    push(record: DbfRecord) {
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
    pushAll(records: DbfRecord[]) {
        //TODO: update docs around...
        records.forEach(r => {
            r.id = -1;
            this._flush(r);
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
    updateRecords(records: DbfRecord[]) {
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

        let recordId = record.id === -1 ? this.__header.recordCount : record.id;
        let position = this.__header.headerLength + this.__header.recordLength * recordId;
        fs.writeSync(this.__fd, buff, 0, buff.length, position);

        if (record.id === -1) {
            this.__header.recordCount++;
        }
    }

    /**
     * Remove record at index.
     * @param {number} index The record index to delete. Start from 0.
     */
    removeAt(index: number) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(index);

        const position = this.__header.headerLength + index * this.__header.recordLength;
        const buff = Buffer.from('*');
        fs.writeSync(this.__fd, buff, 0, 1, position);
    }

    /**
     * Recover the deleted record at index. Edited record doesn't support.
     * @param {number} index The record index to delete. Start from 0.
     */
    recoverRecordAt(index: number) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsGEZero(index);

        const position = this.__header.headerLength + index * this.__header.recordLength;
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
};