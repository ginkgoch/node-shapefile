const _ = require('lodash');
const Validators = require('./Validators');
const Openable = require('./base/StreamOpenable');
const ShapefileIt = require('./ShapefileIterator');
const Shp = require('./shp/Shp');
const Dbf = require('./dbf/Dbf');
const extReg = /\.\w+$/;

module.exports = class Shapefile extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    /**
     * @override
     */
    async _open() {
        Validators.checkFileExists(this.filePath, ['.shp', '.shx', '.dbf']);

        this._shp = new Shp(this.filePath);
        await this._shp.open();

        const filePathDbf = this.filePath.replace(extReg, '.dbf');
        this._dbf = new Dbf(filePathDbf);
        await this._dbf.open();
    }

    /**
     * @override
     */
    async _close() {
        if(this._shp) {
            await this._shp.close();
            this._shp = undefined;
        }

        if(this._dbf) {
            await this._dbf.close();
            this._dbf = undefined;
        }
    }

    header() {
        Validators.checkIsOpened(this.isOpened);
        return this._shp._header;
    }

    envelope() {
        Validators.checkIsOpened(this.isOpened);
        return this._shp.envelope();
    }

    /**
     * 
     * @param {boolean} detail Indicates whether to show field details (name, type, length, decimal) or not.
     */
    fields(detail = false) {
        Validators.checkIsOpened(this.isOpened);
        return this._dbf.fields(detail);
    }

    async iterator(filter) {
        Validators.checkIsOpened(this.isOpened);

        const shpIt = await this._shp.iterator();
        const dbfIt = await this._dbf.iterator();
        const shapefileIt = new ShapefileIt(shpIt, dbfIt);
        shapefileIt.fields = this._normalizeFields(filter && filter.fields);
        shapefileIt.envelope = filter && filter.envelope;
        return shapefileIt;
    }
    
    async count() {
        Validators.checkIsOpened(this.isOpened);
        return await Promise.resolve(this._shp.count());
    }
    
    async get(id, fields) {
        Validators.checkIsOpened(this.isOpened);
        const geom = await this._shp.get(id);
        
        fields = this._normalizeFields(fields);
        const fieldValues = await this._dbf.get(id, fields);
        return _.merge(geom, { fields: fieldValues });
    }

    /**
     * @private
     * @param {*} fields The fields filter could be 'all', 'none', Array.<string> - field names. Default value is 'all' which means returns all fields.
     */
    _normalizeFields(fields) {
        if (fields === 'none') {
            return [];
        }

        const allFields = this._dbf.fields();
        if (_.isArray(fields)) {
            return _.intersection(allFields, fields);
        } else {
            return _.clone(allFields);
        }
    }
}