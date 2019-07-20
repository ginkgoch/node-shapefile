import fs from 'fs'
import _ from 'lodash'
import { BufferReader, BufferWriter } from 'ginkgoch-buffer-io'
import DbfField from './DbfField';
import { DbfFieldType } from './DbfFieldType';

const FILE_TYPE = 0x03;
const FIELD_SIZE = 32;
const FIELD_NAME_SIZE = 11;
const HEADER_GENERAL_SIZE = 32;

export default class DbfHeader {
    fileType: number = FILE_TYPE
    year: number = 0
    month: number = 0
    day: number = 0
    recordCount: number = 0
    headerLength: number = 0
    recordLength: number = 0
    fields: DbfField[]

    constructor(fields?: DbfField[]) {
        this.fields = fields || [];
    }

    /**
     *
     * @param fields
     * @returns {DbfHeader}
     * @static
     */
    static createEmptyHeader(fields?: DbfField[]): DbfHeader {
        const header = new DbfHeader(fields);
        header._init();
        return header;
    }

    read(fd: number) {
        const headerBuffer = Buffer.alloc(HEADER_GENERAL_SIZE);
        fs.readSync(fd, headerBuffer, 0, headerBuffer.length, 0);
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
        const fieldsBuffer = Buffer.alloc(this.headerLength - HEADER_GENERAL_SIZE);
        fs.readSync(fd, fieldsBuffer, 0, fieldsBuffer.length, position);
        while(position < this.headerLength - 1) {
            const field = new DbfField();
            const fieldStart = position - HEADER_GENERAL_SIZE;
            field.name = fieldsBuffer.slice(fieldStart, fieldStart + FIELD_NAME_SIZE).toString().replace(/\0/g, '').trim();

            let fieldTypeStr = String.fromCharCode(fieldsBuffer.readUInt8(fieldStart + 11));
            field.type = DbfHeader._getFieldType(fieldTypeStr);
            if(field.type === DbfFieldType.character) {
                field.length = fieldsBuffer.readUInt16LE(fieldStart + 16);
            } else {
                field.length = fieldsBuffer.readUInt8(fieldStart + 16);
                field.decimal = fieldsBuffer.readUInt8(fieldStart + 17);
            }

            this.fields.push(field);
            position += FIELD_SIZE;
        }
    }

    write(fd: number) {
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

        fs.writeSync(fd, headerBuffer, 0, headerBuffer.length, 0);
    }

    json(): any {
        const json = {
            fileType: this.fileType,
            year: this.year,
            month: this.month,
            day: this.day,
            recordCount: this.recordCount,
            headerLength: this.headerLength,
            recordLength: this.recordLength,
            fields: this.fields.map((v, i, arr) => {  
                return DbfHeader._omitDefaultDecimal(v)
            })
        }

        return json
    }

    static _omitDefaultDecimal(v: DbfField): any {
        const json: any = {
            'name': v.name,
            'type': v.type,
            'length': v.length,
        }

        if (v.type !== DbfFieldType.character) {
            json.decimal = v.decimal
        }

        return json
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

    static _chunkFieldNameBuffer(fieldName: string) {
        const fieldNameBuffer = Buffer.alloc(FIELD_NAME_SIZE);
        const sourceBuffer = Buffer.from(fieldName);
        sourceBuffer.copy(fieldNameBuffer, 0, 0, sourceBuffer.length > FIELD_NAME_SIZE ? FIELD_NAME_SIZE : sourceBuffer.length);
        return fieldNameBuffer;
    }

    static _getFieldType(str: string): DbfFieldType {
        return <DbfFieldType>str
    }
};