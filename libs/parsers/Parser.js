const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const ShapefileType = require('../ShapefileType');
const PointParser = require('./PointParser');

module.exports = class Parser {
    static parsers = { };

    /**
     * 
     * @param {ShapefileType|number} shapefileType 
     */
    static getParser(shapefileType) {

    }

    /**
     * 
     * @param {StreamReader} streamReader 
     */
    async readEnvelope(streamReader) { }
}