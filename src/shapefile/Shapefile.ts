import fs from 'fs';
import _ from "lodash";
import { EventEmitter } from "events";
import { IFeature, Feature } from "ginkgoch-geom";

import Shp from "../shp/Shp";
import Dbf from "../dbf/Dbf";
import Optional from "../base/Optional";
import { Validators, Constants, ShapefileType } from "../shared";
import ShapefileIterator from "./ShapefileIterator";
import StreamOpenable from "../base/StreamOpenable";
import IQueryFilter from "../shared/IQueryFilter";
import DbfField from '../dbf/DbfField';

const extReg = /\.\w+$/;

/**
 * The Shapefile class.
 */
export default class Shapefile extends StreamOpenable {
    filePath: string;
    _flag: string;    
    _shp: Optional<Shp>;
    _dbf: Optional<Dbf>;
    _eventEmitter: EventEmitter|undefined;

    /**
     * Creates a Shapefile instance.
     * @constructor
     * @param {*} filePath The shapefile file path. 
     */
    constructor(filePath: string, flag = 'rs') {
        super();
        this.filePath = filePath;
        this._flag = flag;
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

        this._shp = new Optional(new Shp(this.filePath, this._flag));
        this._shp.value._eventEmitter = this._eventEmitter;
        await this._shp.value.open();

        const filePathDbf = this.filePath.replace(extReg, '.dbf');
        this._dbf = new Optional(new Dbf(filePathDbf, this._flag));
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
    count(): number {
        Validators.checkIsOpened(this.isOpened);

        return this._shp.value.count();
    }

    shapeType(): ShapefileType {
        Validators.checkIsOpened(this.isOpened);

        return this._shp.value.shapeType();
    }
    
    /**
     * Gets shapefile record by a specified id, and returnes with the given fields. If fields is not indicated, all fields will be fetched.
     * @param {number} id The record id. Starts from 0.
     * @param {undefined|'all'|'none'|Array.<string>} fields The fields that will be fetch from DBF file.
     * @returns The record that contains the required id.
     */
    async get(id: number, fields?: string[]): Promise<Feature|null> {
        Validators.checkIsOpened(this.isOpened);
        const geom = await this._shp.value.get(id);
        if (geom === null) {
            return null;
        }
        
        const queryFields = this._normalizeFields(fields);
        const record = await this._dbf.value.get(id, queryFields);
        const feature = new Feature(geom, record.values, geom.id);
        return feature;
    }

    async records(filter?: IQueryFilter): Promise<Array<Feature>> {
        Validators.checkIsOpened(this.isOpened);

        const shapeRecords = await this._shp.value.records(filter);
        const fieldRecords = await this._dbf.value.records(filter);
        const records = _.zipWith(shapeRecords, fieldRecords.map(r => r.values), (s, f) => new Feature(s, f, s.id));
        return records;
    }

    /**
     * Creates an empty shapefile as well as its shape index file and d-base file.
     * @param {string} filePath The shapefile path. File path extension must be '.shp'.
     * @param {ShapefileType} fileType The geometry type that this new shapefile maintains.
     * @param {DbfField[]} fields The fields info of the d-base file.
     * @static
     */
    static createEmpty(filePath: string, fileType: ShapefileType, fields: DbfField[]) {
        Shp.createEmpty(filePath, fileType);

        const dbfFilePath = filePath.replace(/\.shp$/, '.dbf');
        Dbf.createEmpty(dbfFilePath, fields);

        const shapefile = new Shapefile(filePath, 'rs+');
        return shapefile;
    }

    /**
     * Copy the shp, shx and dbf files as another filename.
     */
    static copyFiles(sourceFilename: string, targetFilename: string, overwrite = false) {
        let extensions = ['.shp', '.shx', '.dbf'];

        extensions.forEach(ext => {
            const sourceFilePath = sourceFilename.replace(/\.shp$/, ext);
            const targetFilePath = targetFilename.replace(/\.shp$/, ext);
            if (fs.existsSync(targetFilePath)) {
                if (!fs.existsSync(sourceFilePath)) {
                    return;
                }

                if (overwrite) {
                    fs.unlinkSync(targetFilePath);
                    fs.copyFileSync(sourceFilePath, targetFilePath);
                } else {
                    console.warn(`${sourceFilePath} exists. Copy ignored.`);
                }
            } else {
                fs.copyFileSync(sourceFilePath, targetFilePath);
            }
        })
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