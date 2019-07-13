const fs = require('fs');
const _ = require('lodash');
const { StreamReader } = require('ginkgoch-stream-io');
const { BufferReader } = require('ginkgoch-buffer-io');
const Openable = require('../base/StreamOpenable');
const Validators = require('../Validators');
const DbfIterator = require('./DbfIterator');
const DbfHeader = require('./DbfHeader')

module.exports = class Dbf extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    /**
     * @override
     */
    async _open() {
        this._fd = fs.openSync(this.filePath, 'rs');
        this._header = await this._readHeader();
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

    async _readHeader() {
        Validators.checkIsOpened(this.isOpened);

        const header = new DbfHeader();
        header.read(this._fd);
        return {
            fileType: header.fileType,
            date: new Date(header.year + 1900, header.month, header.day),
            numRecords: header.recordCount,
            headerLength: header.headerLength,
            recordLength: header.recordLength,
            fields: header.fields
        }
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
     * @param {Object.<{ from: number|undefined, limit: number|undefined, fileds: Array.<string>|undefined }>} filter 
     * @returns {Array.{Object}}
     */
    async records(filter) {
        const option = this._getStreamOption(this._header.headerLength + 1);
        const stream = fs.createReadStream(this.filePath, option);
        const records = [];

        filter = this._normalizeFilter(filter);
        const to = filter.from + filter.limit;

        return new Promise(resolve => {
            let index = -1;
            stream.on('readable', () => {
                let buffer = null;
                const recordLength = this._header.recordLength;
                while(null !== (buffer = stream.read(recordLength))) {
                    index++;
                    if (index < filter.from || index >= to) { continue; }

                    const record = DbfIterator._readRecord(buffer, this._header, filter.fields);
                    records.push(record);
                }
            }).on('end', () => {
                resolve(records);
            });
        });
    }
}