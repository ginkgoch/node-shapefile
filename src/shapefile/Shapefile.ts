import _ from "lodash";
import { EventEmitter } from "events";

import Shp from "../shp/Shp";
import Dbf from "../dbf/Dbf";
import IFeature from "./IFeature";
import Optional from "../base/Optional";
import { Validators, Constants } from "../shared";
import ShapefileIterator from "./ShapefileIterator";
import StreamOpenable from "../base/StreamOpenable";
import IQueryFilter from "../shared/IQueryFilter";

const extReg = /\.\w+$/;

/**
 * The Shapefile class.
 */
export default class Shapefile extends StreamOpenable {
    filePath: string;
    _shp: Optional<Shp>;
    _dbf: Optional<Dbf>;
    _eventEmitter: EventEmitter|undefined;

    /**
     * Creates a Shapefile instance.
     * @constructor
     * @param {*} filePath The shapefile file path. 
     */
    constructor(filePath: string) {
        super();
        this.filePath = filePath;
        this._shp = new Optional<Shp>();
        this._dbf = new Optional<Dbf>();
    }

    get eventEmitter(): EventEmitter|undefined {
        return this._eventEmitter;
    }

    set eventEmitter(v: EventEmitter|undefined) {
        this._eventEmitter = v;
        this._shp && (this._shp.value._eventEmitter = v);
    }

    /**
     * Opens the related resources and get ready for reading records.
     * @override
     */
    async _open() {
        Validators.checkFileExists(this.filePath, ['.shp', '.shx', '.dbf']);

        this._shp = new Optional(new Shp(this.filePath));
        this._shp.value._eventEmitter = this._eventEmitter;
        await this._shp.value.open();

        const filePathDbf = this.filePath.replace(extReg, '.dbf');
        this._dbf = new Optional(new Dbf(filePathDbf));
        await this._dbf.value.open();
    }

    /**
     * Closes the related resources and release the file handlers.
     * @override
     */
    async _close() {
        if(this._shp.hasValue) {
            await this._shp.value.close();
            this._shp.reset();
        }

        if(this._dbf.hasValue) {
            await this._dbf.value.close();
            this._dbf.reset();
        }
    }

    /**
     * Gets the header detail of the shapefile.
     * @returns The header of shapefile.
     */
    header() {
        Validators.checkIsOpened(this.isOpened);

        return this._shp.value._header;
    }

    /**
     * Gets the envelope of the shapefile.
     * @returns The envelope of shapefile. 
     */
    envelope() {
        Validators.checkIsOpened(this.isOpened);

        return this._shp.value.envelope();
    }

    /**
     * Gets the fields detail of the shapefile.
     * @param {boolean} detail Indicates whether to show field details (name, type, length, decimal) or not. Default to false.
     * @returns The fields of shapefile.
     */
    fields(detail = false) {
        Validators.checkIsOpened(this.isOpened);

        return this._dbf.value.fields(detail);
    }

    /**
     * Gets the iterator of the shapefile. Used to loop all the records in flow mode.
     * @param {*} filter Indicates the filter for iterating the records. Allows to filter with fields and envelopes.
     * @returns The iterator for looping records of shapefile.
     */
    async iterator(filter?: IQueryFilter) {
        Validators.checkIsOpened(this.isOpened);

        const shpIt = await this._shp.value.iterator();
        const dbfIt = await this._dbf.value.iterator();
        const shapefileIt = new ShapefileIterator(shpIt, dbfIt);
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

        return await Promise.resolve(this._shp.value.count());
    }
    
    /**
     * Gets shapefile record by a specified id, and returnes with the given fields. If fields is not indicated, all fields will be fetched.
     * @param {number} id The record id. Starts from 0.
     * @param {undefined|'all'|'none'|Array.<string>} fields The fields that will be fetch from DBF file.
     * @returns The record that contains the required id.
     */
    async get(id: number, fields?: string[]): Promise<IFeature|null> {
        Validators.checkIsOpened(this.isOpened);
        const geom = await this._shp.value.get(id);
        if (geom === null) {
            return geom;
        }
        
        const queryFields = this._normalizeFields(fields);
        const record = await this._dbf.value.get(id, queryFields);
        return { id: geom.id, geometry: geom.geometry, properties: record.values, type: Constants.FEATURE_TYPE };
    }

    async records(filter?: IQueryFilter): Promise<Array<IFeature>> {
        Validators.checkIsOpened(this.isOpened);

        const shapeRecords = await this._shp.value.records(filter);
        const fieldRecords = await this._dbf.value.records(filter);
        const records = _.zipWith(shapeRecords, fieldRecords.map(r => r.values), (s, f) => {
            const record = _.assign(s, { properties: f, type: Constants.FEATURE_TYPE });
            return record;
        });
        return records;
    }

    /**
     * @private
     * @param {*} fields The fields filter could be 'all', 'none', Array.<string> - field names. Default value is 'all' which means returns all fields.
     */
    _normalizeFields(fields?: 'all'|'none'|string[]) {
        if (fields === 'none') {
            return [];
        }

        const allFields = <string[]>this._dbf.value.fields();
        if (_.isArray(fields)) {
            return _.intersection(allFields, fields);
        } else {
            return _.clone(allFields);
        }
    }
}