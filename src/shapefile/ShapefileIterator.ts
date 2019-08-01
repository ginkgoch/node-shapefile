import { IEnvelope, Feature, Geometry, Envelope } from "ginkgoch-geom";

import _ from "lodash";
import Shp from "../shp/Shp";
import Dbf from "../dbf/Dbf";
import Iterator from '../base/Iterator';
import Optional from "../base/Optional";
import IQueryFilter from "../shared/IQueryFilter";

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
    filter: IQueryFilter;
    from: number;
    to: number;
    index: number;

    constructor(count: number, shp: Shp, dbf: Dbf, filter: IQueryFilter) {
        super();

        this.shp = shp;
        this.dbf = dbf;
        this.count = count;
        this.filter = filter;

        this.from = _.defaultTo(this.filter.from, 1);
        this.index = this.from - 1;
        let limit = _.defaultTo(this.filter.limit, this.count);
        this.to = this.from + limit;
        if (this.to > this.count + 1) {
            this.to = this.count + 1;
        }
    }

    /**
     * Moves to and return the next record. The last record will return with a field { done: true } for a complete reading flag.
     */
    async next(): Promise<Optional<Feature | null>> {
        let record = await this._next();
        while(!this.done && !record.hasValue) {
            record = await this._next();
        }

        return record;
    }

    async _next(): Promise<Optional<Feature | null>> {
        this.index++;
        if (this.index >= this.to) {
            return this._done();
        }

        const recordShp = await this.shp.get(this.index);
        if (recordShp === null) {
            return this._dirty(null);
        } else if (!this._intersects(recordShp, this.filter.envelope)) {
            return this._dirty(null);
        } else {
            const feature = new Feature(recordShp);
            if (this.filter.fields === undefined || this.filter.fields.length > 0) {
                const properties = await this.dbf.get(this.index, this.filter.fields);
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