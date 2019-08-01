import { IEnvelope, Feature, Geometry, Envelope } from "ginkgoch-geom";

import _ from "lodash";
import Shp from "../shp/Shp";
import Dbf from "../dbf/Dbf";
import Iterator from '../base/Iterator';
import Optional from "../base/Optional";
import IQueryFilter from "../shared/IQueryFilter";
import FilterUtils from "../shared/FilterUtils";

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
export default class ShapefileIterator extends Iterator<Feature | null> {
    shp: Shp;
    dbf: Dbf;
    count: number;
    filter: { from: number, limit: number, to: number, fields?: string[], envelope?: IEnvelope };
    index: number;

    constructor(shp: Shp, dbf: Dbf, filter?: IQueryFilter) {
        super();

        this.shp = shp;
        this.dbf = dbf;
        this.count = shp.count();
        let filterOption = FilterUtils.normalize(filter);
        this.filter = _.assign(filterOption, { to: filterOption.from + filterOption.limit });
        if (this.filter.to > this.count + 1) {
            this.filter.to = this.count + 1;
        }

        this.index = this.filter.from - 1;
    }

    /**
     * Moves to and return the next record. The last record will return with a field { done: true } for a complete reading flag.
     */
    next(): Optional<Feature | null> {
        let record = this._next();
        while(!this.done && !record.hasValue) {
            record = this._next();
        }

        return record;
    }

    _next(): Optional<Feature | null> {
        this.index++;
        if (this.index >= this.filter.to) {
            return this._done();
        }

        const recordShp = this.shp.get(this.index);
        if (recordShp === null) {
            return this._dirty(null);
        } else if (!this._intersects(recordShp, this.filter.envelope)) {
            return this._dirty(null);
        } else {
            const feature = new Feature(recordShp);
            if (this.filter.fields === undefined || this.filter.fields.length > 0) {
                const properties = this.dbf.get(this.index, this.filter.fields);
                properties.values.forEach((v, k) => {
                    feature.properties.set(k, v);
                });
            }

            return this._continue(feature);
        }
    }

    _intersects(geom: Geometry, envelope?: IEnvelope) {
        if (envelope === undefined) {
            return true;
        } 

        const disjoined = Envelope.disjoined(geom.envelope(), envelope);
        return !disjoined;
    }
};