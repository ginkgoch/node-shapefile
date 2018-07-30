const _ = require('lodash');
const Validators = require('./Validators');
const Openable = require('./base/StreamOpenable');
const ShapefileIt = require('./ShapefileIterator');
const Shp = require('./shp/Shp');
const Dbf = require('./dbf/Dbf');
const extReg = /\.\w+$/;

module.exports = class Shapefile extends Openable {

    /**
     * Creates a Shapefile instance.
     * @constructor
     * @param {*} filePath The shapefile file path. 
     */
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    /**
     * Opens the related resources and get ready for reading records.
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
     * Closes the related resources and release the file handlers.
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

    /**
     * Gets the header detail of the shapefile.
     * @returns The header of shapefile.
     */
    header() {
        Validators.checkIsOpened(this.isOpened);
        return this._shp._header;
    }

    /**
     * Gets the envelope of the shapefile.
     * @returns The envelope of shapefile. 
     */
    envelope() {
        Validators.checkIsOpened(this.isOpened);
        return this._shp.envelope();
    }

    /**
     * Gets the fields detail of the shapefile.
     * @param {boolean} detail Indicates whether to show field details (name, type, length, decimal) or not. Default to false.
     * @returns The fields of shapefile.
     */
    fields(detail = false) {
        Validators.checkIsOpened(this.isOpened);
        return this._dbf.fields(detail);
    }

    /**
     * Gets the iterator of the shapefile. Used to loop all the records in flow mode.
     * @param { fields: ['all'|'none'|undefined|Array.<string>], envelope: Envelope } filter Indicates the filter for iterating the records. Allows to filter with fields and envelopes.
     * @returns The iterator for looping records of shapefile.
     */
    async iterator(filter) {
        Validators.checkIsOpened(this.isOpened);

        const shpIt = await this._shp.iterator();
        const dbfIt = await this._dbf.iterator();
        const shapefileIt = new ShapefileIt(shpIt, dbfIt);
        shapefileIt.fields = this._normalizeFields(filter && filter.fields);
        shapefileIt.envelope = filter && filter.envelope;
        return shapefileIt;
    }
    
    /**
     * Gets the record count of shapefile.
     * @returns The count of shapefile.
     */
    async count() {
        Validators.checkIsOpened(this.isOpened);
        return await Promise.resolve(this._shp.count());
    }
    
    /**
     * Gets shapefile record by a specified id, and returnes with the given fields. If fields is not indicated, all fields will be fetched.
     * @param {number} id The record id. Starts from 0.
     * @param {undefined|'all'|'none'|Array.<string>} fields The fields that will be fetch from DBF file.
     * @returns The record that contains the required id.
     */
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