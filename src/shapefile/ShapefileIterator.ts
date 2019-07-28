import IFeature from "./IFeature";
import { Constants } from "../shared";
import Iterator from '../base/Iterator';
import { IEnvelope } from "ginkgoch-geom";
import DbfIterator from "../dbf/DbfIterator";
import ShpIterator from "../shp/ShpIterator";

/**
 * The Shapefile iterator.
 * @example Usage
 * const shapefile = await new Shapefile(path).open();
 * const iterator = await shapefile.iterator();
 * 
 * let record = undefined;
 * while ((record = await iterator.next()) && !iterator.done) {
 *      console.log(record);
 * }
 */
export default class ShapefileIterator extends Iterator<IFeature> {
    _shpIt: ShpIterator
    _dbfIt: DbfIterator

    /**
     * @constructor Creates a ShapefileIterator instance.
     * @param {ShpIterator} shpIt The ShpIterator for iterating shp file.
     * @param {DbfIterator} dbfIt The DbfIterator for iterating dbf file.
     */
    constructor(shpIt: ShpIterator, dbfIt: DbfIterator) {
        super();
        this._shpIt = shpIt;
        this._dbfIt = dbfIt;
    }

    /**
     * Sets the field filter for iterator.
     */
    set fields(v: string[]) {
        this._dbfIt.fields = v;
    }

    /**
     * Sets the envelope filter for iterator.
     */
    set envelope(v: IEnvelope|undefined) {
        this._shpIt.envelope = v;
    }

    /**
     * Moves to and return the next record. The last record will return with a field { done: true } for a complete reading flag.
     */
    async next() {
        let record = await this._next();
        while(!this.done && record.value && (record.value.geometry === undefined || record.value.geometry === null)) {
            record = await this._next();
        }

        return record;
    }

    /**
     * @private
     */
    async _next() {
        let shpRecordOpt = await this._shpIt.next();
        let dbfRecordOpt = await this._dbfIt.next();
        if (!this._shpIt.done && !this._dbfIt.done) {
            let record = {} as IFeature;
            let shpRecord = shpRecordOpt.value;
            if (shpRecord !== null) {
                record.id = shpRecord.id;
                record.geometry = shpRecord;
                record.properties = dbfRecordOpt.value.values;
                record.type = Constants.FEATURE_TYPE;
            }
            
            return this._continue(record);
        } else if (this._shpIt.done && this._dbfIt.done) {
            return this._done();
        } else {
            throw 'Record count not matched.';
        }
    }
};