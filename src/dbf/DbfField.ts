import _ from 'lodash'
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

    static fromJson(json: any): DbfField {
        json = _.pickBy(json, i => !_.isUndefined(i));
        json = _.defaults(json, { name:'', type: DbfFieldType.character, length: -1, decimal: 0 });
        const field = new DbfField(json.name, json.type, json.length, json.decimal);
        return field;
    }

    json(): { length: number, type: DbfFieldType, decimal: number, name: string } {
        const json = { 
            name: this.name,
            type: this.type,
            length: this.length,
            decimal: this.decimal
        };

        return json;
    }

    cloneDeep(): DbfField {
        return _.cloneDeep(this);
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