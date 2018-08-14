const fs = require('fs');
const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const Openable = require('../base/StreamOpenable');
const Validators = require('../Validators');
const BufferReader = require('ginkgoch-buffer-reader');
const DbfIterator = require('./DbfIterator');

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

        const headerBuffer = Buffer.alloc(32);
        fs.readSync(this._fd, headerBuffer, 0, headerBuffer.length, 0);
        const headerBr = new BufferReader(headerBuffer);

        const fileType = headerBr.nextInt8();
        const year = await headerBr.nextInt8();
        const month = await headerBr.nextInt8();
        const day = await headerBr.nextInt8();
        const date = new Date(year + 1900, month, day);
        
        const numRecords = headerBr.nextUInt32LE();
        const headerLength = headerBr.nextUInt16LE();
        const recordLength = headerBr.nextUInt16LE();

        let position = headerBuffer.length;
        const fields = [];
        while(position < headerLength - 1) {
            const columnBuffer = Buffer.alloc(32);
            fs.readSync(this._fd, columnBuffer, 0, columnBuffer.length, position);

            const field = { };
            field.name = columnBuffer.slice(0, 11).toString().replace(/\0/g, '').trim();
            field.type = String.fromCharCode(columnBuffer.readUInt8(11));
            if(field.type.toUpperCase() === 'C') {
                field.length = columnBuffer.readUInt16LE(16);
            } else {
                field.length = columnBuffer.readUInt8(16);
                field.decimal = columnBuffer.readUInt8(17);
            }

            fields.push(field);
            position += columnBuffer.length;
        }

        return {
            fileType, date, numRecords, headerLength, recordLength, fields
        };
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

        filter = this._normalizeReadFilter(filter);
        const to = filter.from + filter.limit;

        return new Promise(resolve => {
            stream.on('readable', () => {
                let buffer = null;
                let index = -1;
                const recordLength = this._header.recordLength;
                while(null !== (buffer = stream.read(recordLength))) {
                    index++;
                    if (index < filter.from || index >= to) { continue; }

                    const br = new BufferReader(buffer);
                    const record = DbfIterator._readRecord(br, this._header.fields, filter.fields);
                    records.push(record);
                }
            }).on('end', () => {
                resolve(records);
            });
        });
    }
}