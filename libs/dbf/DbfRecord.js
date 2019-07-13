const DbfHeader = require('./DbfHeader');
const {BufferReader} = require("ginkgoch-buffer-io");

module.exports = class DbfRecord {
    /**
     *
     * @param {DbfHeader} header
     */
    constructor(header) {
        this.header = header;
        this.id = -1;
        this.values = {};
    }

    read(buffer) {
        const br = new BufferReader(buffer);
        for(let i = 0; i < this.header.fields.length; i++) {
            let field = this.header.fields[i];
            let fieldBuff = br.nextBuffer(field.length);
            let fieldText = fieldBuff.toString().replace(/\0/g, '').trim();
            this.values[field.name] = DbfRecord._parseFieldValue(fieldText, field);
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
};