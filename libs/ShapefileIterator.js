const _ = require('lodash');
const Iterator = require('./base/Iterator');
const ShpIterator = require('./shp/ShpIterator');
const DbfIterator = require('./dbf/DbfIterator');

module.exports = class ShapefileIterator extends Iterator {
    /**
     * 
     * @param {ShpIterator} shpIt 
     * @param {DbfIterator} dbfIt 
     */
    constructor(shpIt, dbfIt) {
        super();
        this._shpIt = shpIt;
        this._dbfIt = dbfIt;
    }

    set fields(v) {
        this._dbfIt.fields = v;
    }

    set envelope(v) {
        this._shpIt.envelope = v;
    }

    async next() {
        let shpRecord = await this._shpIt.next();
        let dbfRecord = await this._dbfIt.next();
        if (!shpRecord.done && !dbfRecord.done) {
            shpRecord = _.omit(shpRecord, ['done']);
            dbfRecord = _.omit(dbfRecord, ['done']);
            return this._continue(_.merge(shpRecord, { fields: dbfRecord }));
        } else if (shpRecord.done && dbfRecord.done) {
            return this._done();
        } else {
            throw 'Record count not matched.';
        }
    }
}