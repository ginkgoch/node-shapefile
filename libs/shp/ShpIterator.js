const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const ShpParser = require('./ShpParser');
const ShpReader = require('./ShpReader');
const Iterator = require('../base/Iterator');

module.exports = class ShpIterator extends Iterator {
    /**
     * 
     * @param {StreamReader} streamReader 
     * @param {ShpParser} shpParser
     */
    constructor(streamReader, shpParser) {
        super();

        this.envelope = undefined;
        this._streamReader = streamReader;
        this._shpParser = shpParser;
    }

    /**
     * @override
     */
    async next() {
        let buffer = await this._streamReader.read(8);
        if (buffer === null || buffer.length === 0) {
            return this._done();
        }

        const id = buffer.readInt32BE(0);
        const length = buffer.readInt32BE(4) * 2;
        let contentBuffer = await this._streamReader.read(length);
        if (contentBuffer === null || contentBuffer.length === 0) {
            return this._done();
        }

        let reader = new ShpReader(contentBuffer);
        let content = this._shpParser(reader);
        if(content === null) return null;

        if (_.isUndefined(this.envelope) || (this.envelope && !this.envelope.disjoined(content.envelope))) {
            content = { geom: content.readGeom() };
        } else {
            return null;
        }

        content.id = id;
        return this._continue(content); 
    }
}