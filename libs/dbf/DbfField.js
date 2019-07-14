const DbfFieldType = require('./DbfFieldType');

module.exports = class DbfField {
    constructor(name, fieldType = DbfFieldType.character, length = -1) {
        this.name = name;
        this.type = fieldType;
        this.length = length;
        this.decimal = 0;
        if(this.length === -1) {
            switch (this.type) {
                case DbfFieldType.number:
                case DbfFieldType.float:
                    this.length = 8;
                    break;
                case DbfFieldType.integer:
                    this.length = 4;
                    break;
                case DbfFieldType.boolean:
                    this.length = 1;
                    break;
                case DbfFieldType.date:
                    this.length = 8;
                    break;
                case DbfFieldType.memo:
                    this.length = 64;
                    break;
                default:
                    this.length = 10;
                    break;
            }
        }
    }
};