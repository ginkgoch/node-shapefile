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
        const from = _.defaultTo(filter && filter.from, 0);
        const limit = _.defaultTo(filter && filter.limit, Number.MAX_SAFE_INTEGER);
        const to = from + limit;

        return new Promise(resolve => {
            stream.on('readable', () => {
                const fieldLength = this._header.fields.length;
                const recordLength = this._header.recordLength;
                let buffer = null;
                let index = -1;
                while(null !== (buffer = stream.read(recordLength))) {
                    index++;
                    if (index < from || index >= to) { continue; }

                    const br = new BufferReader(buffer);
                    const record = { };
                    records.push(record);
                    for (let i = 0; i < fieldLength; i++) {
                        const field = this._header.fields[i];
                        const buffer = br.nextBuffer(field.length);
            
                        if (filter && filter.fields && !_.includes(filter.fields, field.name)) continue;
            
                        const text = buffer.toString().replace(/\0/g, '').trim();
                        record[field.name] = Dbf._parseFieldValue(text, field);
                    }
                }
            }).on('end', () => {
                resolve(records);
            });
        });
    }

    static _parseFieldValue(text, fieldInfo) {
        let value = text;
        switch (fieldInfo.type) {
            case 'N':
            case 'F':
            case 'O':
                value = parseFloat(text, 10);
                break;
            case 'D':
                value = new Date(text.slice(0, 4), parseInt(text.slice(4, 6), 10) - 1, text.slice(6, 8));
                break;
            case 'L':
                value = text.toLowerCase() === 'y' || text.toLowerCase() === 't';
                break;
            default:
                break;
        }

        return value;
    }
}