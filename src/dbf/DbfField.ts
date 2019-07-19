import { DbfFieldType } from './DbfFieldType'

export default class DbfField {
    name: string;
    type: DbfFieldType;
    length: number;
    decimal: number;

    constructor(name: string = '', fieldType = DbfFieldType.character, length = -1, decimal = 0) {
        this.name = name;
        this.type = fieldType;
        this.length = length;
        this.decimal = decimal;
        if(this.length === -1) {
            this.length = DbfField._getFieldLength(this.type);
        }
    }

    static _getFieldLength(type: DbfFieldType): number {
        let length: number;

        switch (type) {
            case DbfFieldType.number:
            case DbfFieldType.float:
                length = 8;
                break;
            case DbfFieldType.integer:
                length = 4;
                break;
            case DbfFieldType.boolean:
                length = 1;
                break;
            case DbfFieldType.date:
                length = 8;
                break;
            case DbfFieldType.memo:
                length = 64;
                break;
            default:
                length = 10;
                break;
        }

        return length;
    }
};