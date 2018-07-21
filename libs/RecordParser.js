const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const ShapefileType = require('./ShapefileType');

module.exports = class Parser {
    /**
     * 
     * @param {ShapefileType|number} shapefileType 
     */
    static getParser(shapefileType) {
        Parser.constructor.parsers = _.defaults(Parser.constructor.parsers, { });

        switch(shapefileType) {
            case 1:
                return Parser._getOrSetDefault(Parser.constructor.parsers, 'point', require('./parsers/parsePoint'));
        }

        throw 'Unsupported shapefile type.';
    }

    /**
     * 
     * @param {StreamReader} streamReader 
     */
    async readEnvelope(streamReader) { }

    /**
     * @private
     * @param {*} object 
     * @param {string} path 
     * @param {Parser} dv 
     */
    static _getOrSetDefault(object, path, dv) {
        if(!_.has(object, path)) {
            _.set(object, path, dv)
        }

        return _.get(object, path);
    }
}