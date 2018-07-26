const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const ShapefileType = require('../ShapefileType');

module.exports = class ShpParser {
    /**
     * 
     * @param {ShapefileType|number} shapefileType 
     */
    static getParser(shapefileType) {
        ShpParser.constructor.parsers = _.defaults(ShpParser.constructor.parsers, { });
        
        try {
            const parser = ShpParser._getParser(shapefileType);
            return parser;
        }
        catch (err) {
            throw `Unsupported shapefile type<${shapefileType}>.`;
        }
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
     * @param {ShpParser} dv 
     */
    static _getOrSetDefault(object, path, dv) {
        if(!_.has(object, path)) {
            _.set(object, path, dv)
        }

        return _.get(object, path);
    }

    static _getParser(type) {
        if(_.isNumber(type)) {
            type = _.findKey(ShapefileType, key => key === type);
        }

        const parser = ShpParser._getOrSetDefault(ShpParser.constructor.parsers, type, require(`./parsers/parse${_.capitalize(type)}`));
        return parser;
    }
}