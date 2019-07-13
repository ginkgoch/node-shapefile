const fs = require('fs')
const { BufferReader } = require('ginkgoch-buffer-io')

module.exports = class DbfHeader {
    constructor() {
        this.fileType = 0
        this.year = 0
        this.month = 0
        this.day = 0
        this.recordCount = 0
        this.headerLength = 0
        this.recordLength = 0
        this.fields = []
    }

    read(fileDescriptor) {
        const headerBuffer = Buffer.alloc(32);
        fs.readSync(fileDescriptor, headerBuffer, 0, headerBuffer.length, 0);
        const headerBr = new BufferReader(headerBuffer);

        this.fileType = headerBr.nextInt8();
        this.year = headerBr.nextInt8();
        this.month = headerBr.nextInt8();
        this.day = headerBr.nextInt8();
        
        this.recordCount = headerBr.nextUInt32LE();
        this.headerLength = headerBr.nextUInt16LE();
        this.recordLength = headerBr.nextUInt16LE();

        this.fields = [];
        let position = headerBuffer.length;
        while(position < this.headerLength - 1) { 
            const columnBuffer = Buffer.alloc(32);
            fs.readSync(fileDescriptor, columnBuffer, 0, columnBuffer.length, position);

            const field = { };
            field.name = columnBuffer.slice(0, 11).toString().replace(/\0/g, '').trim();
            field.type = String.fromCharCode(columnBuffer.readUInt8(11));
            if(field.type.toUpperCase() === 'C') {
                field.length = columnBuffer.readUInt16LE(16);
            } else {
                field.length = columnBuffer.readUInt8(16);
                field.decimal = columnBuffer.readUInt8(17);
            }

            this.fields.push(field);
            position += columnBuffer.length;
        }
    }
}