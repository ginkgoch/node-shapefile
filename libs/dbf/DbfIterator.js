const _ = require('lodash');
const Iterator = require('../base/Iterator');
const BufferReader = require('ginkgoch-buffer-reader');

module.exports = class DbfIterator extends Iterator {
    constructor(streamReader, header) {
        super();

        this.fields = undefined;
        this._header = header;
        this._streamReader = streamReader;
    }

    async next() {
        const recordLength = this._header.recordLength;
        const buffer = await this._streamReader.read(recordLength);
        if(buffer === null || buffer.length === 0) {
            return this._done();
        }
        
        const br = new BufferReader(buffer);
        const fieldValues = {};
        for (let i = 0; i < this._header.fields.length; i++) {
            const field = this._header.fields[i];
            const buffer = br.nextBuffer(field.length);

            if(this.fields && !_.includes(this.fields, field.name)) continue;

            const text = buffer.toString().replace(/\0/g, '').trim();
            fieldValues[field.name] = DbfIterator._parseFieldValue(text, field);
        }

        return this._continue(fieldValues);
    }

    static _parseFieldValue(text, fieldInfo) {
        let value = text;
        switch (fieldInfo.type) {
            case 'N':
            case 'F':
            case 'O':
                value = parseFloat(text, 10);
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
}