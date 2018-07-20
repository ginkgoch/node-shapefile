const StreamReader = require('ginkgoch-stream-reader');
const Parser = require('./Parser');

module.exports = class PointParser extends Parser {
    /**
     * @override
     * @param {StreamReader} streamReader 
     * @returns envelope { minx:number, miny:number, maxx:number, maxy:number }.
     */
    async readEnvelope(streamReader) {
        const buffer = await streamReader.read(16);
        const x = buffer.readDoubleLE(0);
        const y = buffer.readDoubleLE(8);
        return { x, y, x, y };
    }
}