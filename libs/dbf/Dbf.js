const fs = require('fs');
const _ = require('lodash');
const { StreamReader } = require('ginkgoch-stream-io');

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
        this._newRowCache = [];
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
        if(!detail) {
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

        const offset = this._header.headerLength + 1 + this._header.recordLength * id;
        const records = await this._getRecordIteractor(offset, offset + this._header.recordLength);
        records.fields = fields;

        const record = await records.next();
        return record.result;
    }

    async iterator(fields) {
        Validators.checkIsOpened(this.isOpened);
    
        const records = await this._getRecordIteractor(this._header.headerLength + 1);
        records.filter = fields;
        return records;
    }

    async _getRecordIteractor(start, end) { 
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
        const option = this._getStreamOption(this._header.headerLength + 1);
        const stream = fs.createReadStream(this.filePath, option);
        const records = [];

        filter = this._normalizeFilter(filter);
        const to = filter.from + filter.limit;

        return new Promise(resolve => {
            let index = -1;
            stream.on('readable', () => {
                const recordLength = this._header.recordLength;

                let buffer = stream.read(recordLength);
                while(null !== buffer) {
                    index++;
                    const currentBuff = buffer;
                    buffer = stream.read(recordLength);

                    if (index < filter.from || index >= to) {
                        continue;
                    }

                    const record = DbfIterator._readRecord(currentBuff, this._header, filter.fields);
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
     *
     * @param {Object} row
     */
    pushRow(row) {
        this._newRowCache.push(row);
    }

    /**
     *
     * @param {Array<DbfRecord>} rows
     */
    pushRows(rows) {
        rows.forEach(r => this.pushRow(r));
    }

    flush() {
        Validators.checkIsOpened(this.isOpened);

        if (this._newRowCache.length === 0) {
            return;
        }

        for(let row of this._newRowCache) {
            const record = new DbfRecord(this._header);
            record.values = row;
            this._flush(record);
        }

        this._header.write(this._fd);
        this._newRowCache = [];
    }

    /**
     *
     * @param {DbfRecord} record
     * @private
     */
    _flush(record) {
        const buff = Buffer.alloc(this._header.recordLength);
        record.write(buff);

        let position = this._header.headerLength + this._header.recordLength * this._header.recordCount;
        fs.writeSync(this._fd, buff, 0, buff.length, position);
        this._header.recordCount++;
    }
};