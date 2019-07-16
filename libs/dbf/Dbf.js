const fs = require('fs');
const _ = require('lodash');
const {StreamReader} = require('ginkgoch-stream-io');

const Openable = require('../base/StreamOpenable');
const Validators = require('../Validators');
const DbfIterator = require('./DbfIterator');
const DbfHeader = require('./DbfHeader');
const DbfField = require('./DbfField');
const DbfRecord = require('./DbfRecord');

module.exports = class Dbf extends Openable {
    constructor(filePath, flag = 'rs') {
        super();
        this.filePath = filePath;
        this._flag = flag;
        this._pushRowCache = [];
        this._updateRowCache = [];
    }

    /**
     * @override
     */
    async _open() {
        this._fd = fs.openSync(this.filePath, this._flag);
        this._header = this._readHeader();
        await Promise.resolve();
    }

    /**
     *
     * @param {boolean} detail Indicates whether to show field details (name, type, length, decimal) or not.
     */
    fields(detail = false) {
        let fields = _.cloneDeep(this._header.fields);
        if (!detail) {
            fields = fields.map(f => f.name);
        }

        return fields;
    }

    /**
     * @override
     */
    async _close() {
        fs.closeSync(this._fd);
        this._fd = undefined;
    }

    _readHeader() {
        const header = new DbfHeader();
        header.read(this._fd);
        return header;
    }

    async get(id, fields) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsValid(id);

        const offset = this._header.headerLength + this._header.recordLength * id;
        const records = await this._getRecordIterator(offset, offset + this._header.recordLength);
        records.fields = fields;
        records._index = id - 1;

        const record = await records.next();
        return record.result;
    }

    async iterator(fields) {
        Validators.checkIsOpened(this.isOpened);

        const iterator = await this._getRecordIterator(this._header.headerLength);
        iterator.filter = fields;
        return iterator;
    }

    /**
     *
     * @param start
     * @param end
     * @returns {Promise<DbfIterator|*>}
     * @private
     */
    async _getRecordIterator(start, end) {
        const option = this._getStreamOption(start, end);
        const stream = fs.createReadStream(this.filePath, option);
        const sr = new StreamReader(stream);
        await sr.open();
        return new DbfIterator(sr, this._header);
    }

    /**
     * @param {Object.<{ from: number|undefined, limit: number|undefined, fields: Array.<string>|undefined }>} filter
     * @returns {Array.<Object>}}
     */
    async records(filter = null) {
        const option = this._getStreamOption(this._header.headerLength);
        const stream = fs.createReadStream(this.filePath, option);
        const records = [];

        filter = this._normalizeFilter(filter);
        const to = filter.from + filter.limit;

        return new Promise(resolve => {
            let index = -1;
            stream.on('readable', () => {
                const recordLength = this._header.recordLength;

                let buffer = stream.read(recordLength);
                while (null !== buffer) {
                    index++;
                    if (buffer.length < recordLength) {
                        break;
                    }

                    const currentBuff = buffer;
                    buffer = stream.read(recordLength);

                    if (index < filter.from || index >= to) {
                        continue;
                    }

                    const record = DbfIterator._readRecord(currentBuff, this._header, filter.fields);
                    record.id = index;
                    records.push(record.raw());
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
     * @param options Options to create the writable stream.
     * @returns {Dbf}
     * @static
     */
    static createEmptyDbf(filePath, fields, options = null) {
        const dbfFile = new Dbf(filePath, 'rs+');
        dbfFile._header = DbfHeader.createEmptyHeader(fields);

        const fd = fs.openSync(filePath, 'w');
        dbfFile._header.write(fd);
        fs.closeSync(fd);

        return dbfFile;
    }

    /**
     * Push single row values into memory. Call flush() to persistent into file.
     * @param {Object} record The field values of one record.
     * @example
     * dbf.pushRow({ rec:1, name:'china' });
     */
    pushRow(record) {
        this._pushRowCache.push(record);
    }

    /**
     * Push multiple rows' values into memory. Call flush() to persistent into file.
     * @param {Array<Object>} records The field values array.
     * @example
     * dbf.pushRows([{ rec:1, name:'china'}, {rec:2, name:'usa'}]);
     */
    pushRows(records) {
        records.forEach(r => this.pushRow(r));
    }

    /**
     * Update a specific row values. Call flush() to persistent into file.
     * @param {Object} record Record to update.
     * @example
     * const record = {id: 0, values: {rec: 1, name: 'usa'}};
     * dbf.updateRow(record);
     */
    updateRow(record) {

    }

    /**
     * Update a specific row values. Call flush() to persistent into file.
     * @param {Array.<Object>} records Records to update.
     * @example
     * const records = [{id: 0, values: {rec: 1, name: 'usa'}}];
     * dbf.updateRows(records);
     */
    updateRows(records) {
        records.forEach(r => this.updateRow(r));
    }

    flush() {
        Validators.checkIsOpened(this.isOpened);

        for (let row of this._updateRowCache) {
            const record = new DbfRecord(this._header);
            record.id = row.id;
            record.values = row.values;
            this._flush(record);
        }

        for (let row of this._pushRowCache) {
            const record = new DbfRecord(this._header);
            record.values = row;
            this._flush(record);
        }

        if (this._pushRowCache.length > 0) {
            this._header.write(this._fd);
            this._pushRowCache = [];
        }
    }

    /**
     *
     * @param {DbfRecord} record
     * @private
     */
    _flush(record) {
        const buff = Buffer.alloc(this._header.recordLength);
        record.write(buff);

        let recordId = record.id === -1 ? this._header.recordCount : record.id;
        let position = this._header.headerLength + this._header.recordLength * recordId;
        fs.writeSync(this._fd, buff, 0, buff.length, position);

        if (record.id === -1) {
            this._header.recordCount++;
        }
    }

    /**
     * Remove record at index.
     * @param {number} index The record index to delete. Start from 0.
     */
    removeAt(index) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsValid(index);

        const position = this._header.headerLength + index * this._header.recordLength;
        const buff = Buffer.from('*');
        fs.writeSync(this._fd, buff, 0, 1, position);
    }

    /**
     * Recover the deleted record at index. Edited record doesn't support.
     * @param {number} index The record index to delete. Start from 0.
     */
    recoverAt(index) {
        Validators.checkIsOpened(this.isOpened);
        Validators.checkIndexIsValid(index);

        const position = this._header.headerLength + index * this._header.recordLength;
        const buff = Buffer.from(' ');
        fs.writeSync(this._fd, buff, 0, 1, position);
    }

    /**
     * Open file for editing. If it is opened, it will be closed and reopen with rs+ flag.
     */
    openForEdit() {
        if (!this._fd) {
            fs.closeSync(this._fd);
        }

        this._fd = fs.openSync(this.filePath, 'rs+');
    }
};