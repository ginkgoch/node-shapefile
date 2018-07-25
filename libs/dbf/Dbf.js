const fs = require('fs');
const StreamReader = require('ginkgoch-stream-reader');
const Openable = require('../Openable');
const Validators = require('../Validators');
const RecordReader = require('../RecordReader');

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
    }

    async _readHeader() {
        Validators.checkIsOpened(this.isOpened);

        const stream = fs.createReadStream(null, { fd: this._fd });
        const sr = new StreamReader(stream);
        const headerBuffer = await sr.read(32);
        const headerBufferReader = new RecordReader(headerBuffer);

        const fileType = headerBufferReader.nextInt8();
        const year = await headerBufferReader.nextInt8();
        const month = await headerBufferReader.nextInt8();
        const day = await headerBufferReader.nextInt8();
        const date = new Date(year + 1900, month, day);
        
        const numRecords = headerBufferReader.nextUInt32LE();
        const headerLength = headerBufferReader.nextUInt16LE();

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
            fileType, date, numRecords, headerLength, fields
        };
    }
}