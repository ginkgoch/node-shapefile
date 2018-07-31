const _ = require('lodash');
const Iterator = require('./base/Iterator');
const ShpIterator = require('./shp/ShpIterator');
const DbfIterator = require('./dbf/DbfIterator');

/**
 * The Shapefile iterator.
 * @example Usage
 * const shapefile = await new Shapefile(path).open();
 * const iterator = await shapefile.iterator();
 * 
 * let record = undefined;
 * while ((record = await iterator.next()) && !record.done) {
 *      console.log(record);
 * }
 */
module.exports = class ShapefileIterator extends Iterator {
    /**
     * @constructor Creates a ShapefileIterator instance.
     * @param {ShpIterator} shpIt The ShpIterator for iterating shp file.
     * @param {DbfIterator} dbfIt The DbfIterator for iterating dbf file.
     */
    constructor(shpIt, dbfIt) {
        super();
        this._shpIt = shpIt;
        this._dbfIt = dbfIt;
    }

    /**
     * Sets the field filter for iterator.
     */
    set fields(v) {
        this._dbfIt.fields = v;
    }

    /**
     * Sets the envelope filter for iterator.
     */
    set envelope(v) {
        this._shpIt.envelope = v;
    }

    /**
     * Moves to and return the next record. The last record will return with a field { done: true } for a complete reading flag.
     */
    async next() {
        let record = await this._next();
        while(!record.done && record.geometry === null) {
            record = await this._next();
        }

        return record;
    }

    /**
     * @private
     */
    async _next() {
        let shpRecord = await this._shpIt.next();
        let dbfRecord = await this._dbfIt.next();
        if (!shpRecord.done && !dbfRecord.done) {
            shpRecord = _.omit(shpRecord, ['done']);
            dbfRecord = _.omit(dbfRecord, ['done']);
            return this._continue(_.merge(shpRecord, { properties: dbfRecord, type: 'Feature' }));
        } else if (shpRecord.done && dbfRecord.done) {
            return this._done();
        } else {
            throw 'Record count not matched.';
        }
    }
}