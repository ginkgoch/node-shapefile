const fs = require('fs');
const _ = require('lodash');
const { BufferReader, BufferWriter } = require('ginkgoch-buffer-io');

const FILE_TYPE = 0x03;
const FIELD_SIZE = 32;
const FIELD_NAME_SIZE = 11;
const HEADER_GENERAL_SIZE = 32;

module.exports = class DbfHeader {
    constructor(fields = null) {
        this.fileType = FILE_TYPE;
        this.year = 0;
        this.month = 0;
        this.day = 0;
        this.recordCount = 0;
        this.headerLength = 0;
        this.recordLength = 0;
        this.fields = fields || [];
    }

    /**
     *
     * @param fields
     * @returns {DbfHeader}
     * @static
     */
    static createEmptyHeader(fields = null) {
        const header = new DbfHeader(fields);
        header._init();
        return header;
    }

    read(fileDescriptor) {
        const headerBuffer = Buffer.alloc(HEADER_GENERAL_SIZE);
        fs.readSync(fileDescriptor, headerBuffer, 0, headerBuffer.length, 0);
        const headerBr = new BufferReader(headerBuffer);

        this.fileType = headerBr.nextInt8();
        this.year = headerBr.nextInt8() + 1900;
        this.month = headerBr.nextInt8();
        this.day = headerBr.nextInt8();
        
        this.recordCount = headerBr.nextUInt32LE();
        this.headerLength = headerBr.nextUInt16LE();
        this.recordLength = headerBr.nextUInt16LE();

        this.fields = [];
        let position = headerBuffer.length;
        //TODO: can improve...
        while(position < this.headerLength - 1) { 
            const fieldBuffer = Buffer.alloc(FIELD_SIZE);
            fs.readSync(fileDescriptor, fieldBuffer, 0, fieldBuffer.length, position);

            const field = { };
            field.name = fieldBuffer.slice(0, FIELD_NAME_SIZE).toString().replace(/\0/g, '').trim();
            field.type = String.fromCharCode(fieldBuffer.readUInt8(11));
            if(field.type.toUpperCase() === 'C') {
                field.length = fieldBuffer.readUInt16LE(16);
            } else {
                field.length = fieldBuffer.readUInt8(16);
                field.decimal = fieldBuffer.readUInt8(17);
            }

            this.fields.push(field);
            position += fieldBuffer.length;
        }
    }

    write(fileDescriptor) {
        const headerBuffer = Buffer.alloc(HEADER_GENERAL_SIZE + FIELD_SIZE * this.fields.length + 1);
        const headerWriter = new BufferWriter(headerBuffer);
        headerWriter.writeInt8(this.fileType);
        headerWriter.writeInt8(this.year - 1900);
        headerWriter.writeInt8(this.month);
        headerWriter.writeInt8(this.day);
        headerWriter.writeUInt32(this.recordCount);
        headerWriter.writeUInt16(this.headerLength);
        headerWriter.writeUInt16(this.recordLength);

        let index = 0;
        for (let field of this.fields ) {
            const position = HEADER_GENERAL_SIZE + index * FIELD_SIZE;
            headerWriter.seek(position);
            const fieldNameBuffer = DbfHeader._chunkFieldNameBuffer(field.name);
            headerWriter.writeBuffer(fieldNameBuffer);

            const fieldTypeCode = field.type.charCodeAt(0);
            headerWriter.writeUInt8(fieldTypeCode);

            headerWriter.seek(position + 16);
            if (field.type.toUpperCase() === 'C') {
                headerWriter.writeUInt16(field.length);
            } else {
                headerWriter.writeUInt8(field.length);
                headerWriter.writeUInt8(field.decimal);
            }

            index++;
        }

        fs.writeSync(fileDescriptor, headerBuffer, 0, headerBuffer.length, 0);
    }

    _init() {
        const today = new Date();
        this.year = today.getFullYear();
        this.month = today.getMonth() + 1;
        this.day = today.getDate();

        if (this.fields.length > 0) {
            this.recordLength = _.sum(this.fields.map(f => f.length)) + 1;
        }

        this.headerLength = HEADER_GENERAL_SIZE + FIELD_SIZE * this.fields.length + 1;
    }

    static _chunkFieldNameBuffer(fieldName) {
        const fieldNameBuffer = Buffer.alloc(FIELD_NAME_SIZE);
        const sourceBuffer = Buffer.from(fieldName);
        sourceBuffer.copy(fieldNameBuffer, 0, 0, sourceBuffer.length > FIELD_NAME_SIZE ? FIELD_NAME_SIZE : sourceBuffer.length);
        return fieldNameBuffer;
    }
};