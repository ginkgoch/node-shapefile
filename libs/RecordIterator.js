const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const RecordParser = require('./RecordParser');
const Iterator = require('./Iterator');

module.exports = class RecordIterator extends Iterator {
    /**
     * 
     * @param {StreamReader} streamReader 
     * @param {RecordParser} recordParser
     */
    constructor(streamReader, recordParser) {
        super();
        
        this._streamReader = streamReader;
        this._recordParser = recordParser;
    }

    /**
     * @override
     */
    async next() {
        let buffer = await this._streamReader.read(8);
        if (buffer === null || buffer.length === 0) {
            return this._done();// { done: true };
        }

        const id = buffer.readInt32BE(0);
        const length = buffer.readInt32BE(4) * 2;
        let contentBuffer = await this._streamReader.read(length);
        if (contentBuffer === null || contentBuffer.length === 0) {
            return this._done();// { done: true }
        }

        const content = this._recordParser(contentBuffer);
        content.id = id;
        return this._continue(content); //_.merge({ done: false }, { id }, content);
    }
}