const _ = require('lodash');
const {BufferReader, BufferWriter} = require("ginkgoch-buffer-io");

const DbfHeader = require('./DbfHeader');
const DbfFieldType = require('./DbfFieldType');

module.exports = class DbfRecord {
    /**
     *
     * @param {DbfHeader} header
     */
    constructor(header = null) {
        this.header = header;
        this.id = -1;
        this.values = {};
        this.deleted = false;
    }

    read(buffer) {
        const br = new BufferReader(buffer);
        this.deleted = br.nextString(1) === '*';
        for(let i = 0; i < this.header.fields.length; i++) {
            let field = this.header.fields[i];

            let fieldBuff = br.nextBuffer(field.length);
            let fieldText = fieldBuff.toString().replace(/\0/g, '').trim();
            this.values[field.name] = DbfRecord._parseFieldValue(fieldText, field);
        }

        return this;
    }

    write(buffer) {
        const bw = new BufferWriter(buffer);
        bw.writeString(' ');

        let position = 1;
        for(let i = 0; i < this.header.fields.length; i++) {
            bw.seek(position);
            let field = this.header.fields[i];
            let value = this.values[field.name];

            switch(field.type) {
                case DbfFieldType.number:
                    DbfRecord._writeNumberValue(bw, value, field);
                    break;
                case DbfFieldType.float:
                    bw.writeFloat(parseFloat(value));
                    break;
                case DbfFieldType.integer:
                    DbfRecord._writeIntegerValue(bw, value);
                    break;
                case DbfFieldType.boolean:
                    DbfRecord._writeBooleanValue(bw, value);
                    break;
                case DbfFieldType.date:
                    DbfRecord._writeDateValue(bw, value);
                    break;
                case DbfFieldType.binary:
                    throw new Error("Binary is not supported.");
                case DbfFieldType.memo:
                    throw new Error("Memo is not supported.");
                default:
                    const fieldBuff = Buffer.alloc(field.length);
                    fieldBuff.write(value);
                    bw.writeBuffer(fieldBuff);
                    break;
            }

            position += field.length;
        }
        return this;
    }

    static _parseFieldValue(text, field) {
        let value = text;
        switch (field.type) {
            case 'N':
            case 'F':
            case 'O':
                value = parseFloat(text);
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

    /**
     *
     * @param {BufferWriter} bufferWriter
     * @param {string} value
     */
    static _writeBooleanValue(bufferWriter, value) {
        switch (value.toUpperCase()) {
            case 'TRUE':
            case '1':
            case 'T':
            case 'YES':
            case 'Y':
                bufferWriter.writeString('T');
                break;
            case ' ':
            case '?':
                bufferWriter.writeString('?');
                break;
            default:
                bufferWriter.writeString('F');
                break;
        }
    }

    static _writeIntegerValue(bufferWriter, value) {
        if(!_.isInteger(value)) {
            value = parseInt(value);
        }
        bufferWriter.writeInt32(value);
    }

    static _writeDateValue(bufferWriter, value) {
        if(!_.isDate(value)) {
            value = new Date(value)
        }

        const formattedDate = DbfRecord._formatDate(value);
        bufferWriter.writeString(formattedDate);
    }

    static _formatDate(date) {
        const year = _.padStart(date.getFullYear(), 4, '0');
        const month = _.padStart(date.getMonth() + 1, 2, '0');
        const day = _.padStart(date.getDate(), 2, '0');
        return `${year}${month}${day}`;
    }

    static _writeNumberValue(bufferWriter, value, field) {
        const buff = DbfRecord._getNumberBuffer(value, field);
        bufferWriter.writeBuffer(buff);
    }

    static _getNumberBuffer(value, field) {
        const buff = Buffer.alloc(field.length);
        value = value.toString();
        const dotIndex = value.indexOf('.');
        if (field.decimal > 0 && dotIndex > -1) {
            let decimalLength = field.decimal;
            if (decimalLength > field.length - 2) {
                decimalLength = field.length = 2;
            }

            let decimalStr = value.substr(dotIndex + 1);
            if (decimalStr.length > decimalLength) {
                decimalStr = decimalStr.substr(0, decimalLength);
            }
            let integerStr = value.substr(0, dotIndex);
            if (integerStr.length > field.length - decimalLength - 1) {
                throw new Error(`number length is larger than field length. value:${value}, field:${field.name}, length:${field.length}, decimal:${field.decimal}.`);
            }
            let numberStr = `${integerStr}.${decimalStr}`;
            buff.write(numberStr);
        } else {
            buff.write(value);
        }
        return buff;
    }

    /**
     * Gets current record raw data.
     */
    raw() {
        const rawData = {
            id: this.id,
            values: this.values
        };

        if (this.deleted) {
            rawData.deleted = true;
        }

        return rawData;
    }
};