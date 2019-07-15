const _ = require('lodash');
const Iterator = require('../base/Iterator');
const DbfRecord = require('./DbfRecord');
const DbfHeader = require('./DbfHeader');

module.exports = class DbfIterator extends Iterator {
    constructor(streamReader, header) {
        super();

        this.fields = undefined;
        this._header = header;
        this._streamReader = streamReader;
    }

    /**
     * @override
     * @returns {Promise<{result, done}|{done}|*>}
     */
    async next() {
        const recordLength = this._header.recordLength;
        const buffer = await this._streamReader.read(recordLength);
        if(buffer === null || buffer.length < recordLength) {
            return this._done();
        }

        const fieldValues = DbfIterator._readRecord(buffer, this._header, this.fields);
        return this._continue(fieldValues);
    }

    /**
     *
     * @param {Buffer} buffer
     * @param {DbfHeader} header
     * @param {Array<string>} requiredFieldNames
     * @returns {Object}
     */
    static _readRecord(buffer, header, requiredFieldNames) {
        const record = new DbfRecord(header).read(buffer);
        let values = record.values;
        if(requiredFieldNames) {
            values = _.pick(values, requiredFieldNames);
        }
        return values;
    }
};