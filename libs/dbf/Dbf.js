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
        this._fd = fs.openSync(this.filePath, 'r');
        this._header = await this._readHeader();
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

        const stream = fs.createReadStream(null, { fd: this._fd, autoClose: false });
        const sr = new StreamReader(stream);
        const headerBuffer = await sr.read(32);
        const headerBufferReader = new BufferReader(headerBuffer);

        const fileType = headerBufferReader.nextInt8();
        const year = await headerBufferReader.nextInt8();
        const month = await headerBufferReader.nextInt8();
        const day = await headerBufferReader.nextInt8();
        const date = new Date(year + 1900, month, day);
        
        const numRecords = headerBufferReader.nextUInt32LE();
        const headerLength = headerBufferReader.nextUInt16LE();
        const recordLength = headerBufferReader.nextUInt16LE();

        let position = headerBuffer.length;
        const fields = [];
        while(position < headerLength - 1) {
            const columnBuffer = await sr.read(32);
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

    async get(id) {
        Validators.checkIsOpened(this.isOpened);

        const offset = this._header.headerLength + 1 + this._header.recordLength * id;
        const records = await this._getRecordIteractor(offset, offset + this._header.recordLength);
        const record = await records.next();
        return _.omit(record, ['done']);
    }

    async readRecords() {
        Validators.checkIsOpened(this.isOpened);
    
        const records = await this._getRecordIteractor(this._header.headerLength + 1);
        return records;
    }

    async _getRecordIteractor(start, end) { 
        const option = this._getStreamOption(start, end);
        const stream = fs.createReadStream(null, option);
        const sr = new StreamReader(stream);
        await sr.open();
        return new DbfIterator(sr, this._header);
    }
}