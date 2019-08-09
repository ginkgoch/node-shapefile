import _ from 'lodash'
import DbfField from './DbfField';
import DbfHeader from './DbfHeader'
import {DbfFieldType} from './DbfFieldType'
import {BufferReader, BufferWriter} from 'ginkgoch-buffer-io'

export default class DbfRecord {
    id: number
    deleted: boolean
    values: Map<string, any>
    header: DbfHeader|undefined

    constructor(props?: any)
    constructor(props?: Map<string, any>)
    constructor(header?: DbfHeader) 
    constructor(param?: DbfHeader | Map<string, any> | any ) {
        this.id = -1;
        this.values = new Map<string, any>();
        this.deleted = false;

        if (param instanceof DbfHeader) {
            this.header = param as DbfHeader;
        } else if (param instanceof Map) {
            (<Map<string, any>>param).forEach((v, k, m) => {
                this.values.set(k, v);
            });
        } else if (param instanceof Object) {
            Object.keys(param).forEach((k, i, arr) => {
                this.values.set(k, param[k]);
            });
        }
    }

    read(buffer: Buffer): DbfRecord {
        const br = new BufferReader(buffer);
        this.deleted = br.nextString(1) === '*';
        for(let i = 0; i < (<DbfHeader>this.header).fields.length; i++) {
            let field = (<DbfHeader>this.header).fields[i];

            let fieldBuff = br.nextBuffer(field.length);
            let fieldText = fieldBuff.toString().replace(/\0/g, '').trim();
            this.values.set(field.name, DbfRecord._parseFieldValue(fieldText, field));
        }

        return this;
    }

    write(buffer: Buffer): DbfRecord {
        const bw = new BufferWriter(buffer);
        bw.writeString(' ');

        let position = 1;
        for(let i = 0; i < (<DbfHeader>this.header).fields.length; i++) {
            bw.seek(position);
            let field = (<DbfHeader>this.header).fields[i];
            let value = this.values.get(field.name);

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
                    if (value !== undefined) {
                        fieldBuff.write(value);
                    }
                    bw.writeBuffer(fieldBuff);
                    break;
            }

            position += field.length;
        }
        return this;
    }

    filter(fieldNames: string[]) {
        DbfRecord._pickFieldValues(this, fieldNames);
    }

    static _pickFieldValues(record: DbfRecord, fieldNames?: string[]) {
        if (!fieldNames) {
            return;
        }

        const fieldValues = new Map;
        fieldNames.forEach(v => {
            if (record.values.has(v)) {
                fieldValues.set(v, record.values.get(v));
            }
        });

        record.values = fieldValues;
    }

    static _parseFieldValue(text: string, field: DbfField): any {
        let value: any = text;
        switch (field.type) {
            case 'N':
            case 'F':
            case 'I':
                value = parseFloat(text);
                break;
            case 'D':
                value = new Date(parseInt(text.slice(0, 4), 10), parseInt(text.slice(4, 6), 10) - 1, parseInt(text.slice(6, 8)));
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
     * @param {BufferWriter} writer
     * @param {string} value
     */
    static _writeBooleanValue(writer: BufferWriter, value: string) {
        switch (value.toUpperCase()) {
            case 'TRUE':
            case '1':
            case 'T':
            case 'YES':
            case 'Y':
                writer.writeString('T');
                break;
            case ' ':
            case '?':
                writer.writeString('?');
                break;
            default:
                writer.writeString('F');
                break;
        }
    }

    static _writeIntegerValue(writer: BufferWriter, value: any) {
        if(!_.isInteger(value)) {
            value = parseInt(value);
        }
        writer.writeInt32(value);
    }

    static _writeDateValue(writer: BufferWriter, value: any) {
        if(!_.isDate(value)) {
            value = new Date(value)
        }

        const formattedDate = DbfRecord._formatDate(value);
        writer.writeString(formattedDate);
    }

    static _formatDate(date: Date): string {
        const year = _.padStart(date.getFullYear().toString(), 4, '0');
        const month = _.padStart((date.getMonth() + 1).toString(), 2, '0');
        const day = _.padStart((date.getDate()).toString(), 2, '0');
        return `${year}${month}${day}`;
    }

    static _writeNumberValue(writer: BufferWriter, value: any, field: DbfField) {
        const buff = DbfRecord._getNumberBuffer(value, field);
        writer.writeBuffer(buff);
    }

    static _getNumberBuffer(value: any, field: DbfField): Buffer {
        const buff = Buffer.alloc(field.length);
        if (value === undefined) return buff;

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
    json(): any {
        const fieldValues: any = {}
        this.values.forEach((v, k, m) => {
            fieldValues[k] = v
        })

        const rawData = {
            id: this.id,
            values: fieldValues
        };

        if (this.deleted) {
            (<any>rawData).deleted = true;
        }

        return rawData;
    }

    static fromJson(json: any): DbfRecord {
        const record = new DbfRecord();

        if (_.has(json, 'id')) {
            record.id = _.get(json, 'id');
        }

        if (_.has(json, 'values')) {
            _.forOwn(_.get(json, 'values'), (v, k) => {
                record.values.set(k, v);
            });
        }

        if (_.has(json, 'deleted')) {
            record.deleted = _.get(json, 'deleted');
        }

        return record;
    }
};