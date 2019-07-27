import _ from "lodash";
import { StreamReader } from "ginkgoch-stream-io";

import Iterator from "../../src/base/Iterator";
import Optional from "../../src/base/Optional";
import ShpReader from "../../src/shp/ShpReader";
import { Envelope, IEnvelope, Geometry } from 'ginkgoch-geom';
import GeomParser from "../../src/shp/parser/GeomParser";

export default class ShpIterator extends Iterator<{ id: number, geometry: Geometry|null }> {
    envelope: IEnvelope|undefined;
    _streamReader: StreamReader;
    _shpParser: GeomParser;

    /**
     * 
     * @param {StreamReader} streamReader 
     * @param {ShpParser} shpParser
     */
    constructor(streamReader: StreamReader, shpParser: GeomParser) {
        super();

        this.envelope = undefined;
        this._streamReader = streamReader;
        this._shpParser = shpParser;
    }

    /**
     * @override
     */
    async next(): Promise<Optional<{ id: number, geometry: Geometry|null }>> {
        let buffer = <Buffer>await this._streamReader.read(8);
        if (buffer === null || buffer.length === 0) {
            return this._done();
        }

        const id = buffer.readInt32BE(0);
        const length = buffer.readInt32BE(4) * 2;
        let contentBuffer = <Buffer>await this._streamReader.read(length);
        if (contentBuffer === null || contentBuffer.length === 0) {
            return this._done();
        }

        let reader = new ShpReader(contentBuffer);
        let content = this._shpParser.read(reader);
        if (content === null) {
            return this._dirty(content);
        }

        let record: { id: number, geometry: Geometry|null };
        if (_.isUndefined(this.envelope) || (this.envelope && !Envelope.disjoined(content.envelope, this.envelope))) {
            const geometry = content.readGeom();
            geometry.id = id;
            record = { id, geometry };
        } else {
            record = { id, geometry: null };
        }

        return this._continue(record); 
    }
};