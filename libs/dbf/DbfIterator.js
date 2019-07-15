const _ = require('lodash');
const Iterator = require('../base/Iterator');
const DbfRecord = require('./DbfRecord');
const DbfHeader = require('./DbfHeader');

module.exports = class DbfIterator extends Iterator {
    constructor(streamReader, header) {
        super();

        this.fields = undefined;
        this._index = -1;
        this._header = header;
        this._streamReader = streamReader;
    }

    /**
     * @override
     * @returns {Promise<{result, done}|{done}|*>}
     */
    async next() {
        this._index++;
        const recordLength = this._header.recordLength;
        const buffer = await this._streamReader.read(recordLength);
        if(buffer === null || buffer.length < recordLength) {
            return this._done();
        }

        const record = DbfIterator._readRecord(buffer, this._header, this.fields);
        record.id = this._index;
        return this._continue(record.raw());
    }

    /**
     *
     * @param {Buffer} buffer
     * @param {DbfHeader} header
     * @param {Array<string>} requiredFieldNames
     * @returns {DbfRecord}
     */
    static _readRecord(buffer, header, requiredFieldNames) {
        const record = new DbfRecord(header).read(buffer);
        if(requiredFieldNames) {
            record.values = _.pick(record.values, requiredFieldNames);
        }
        return record;
    }
};