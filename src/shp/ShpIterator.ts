import _ from "lodash";
import { Envelope, IEnvelope, Geometry } from 'ginkgoch-geom';

import Iterator from "../base/Iterator";
import Optional from "../base/Optional";
import ShpReader from "./ShpReader";
import GeomParser from "./parser/GeomParser";
import { FileReader } from "../shared/FileReader";

export default class ShpIterator extends Iterator<Geometry | null> {
    envelope: IEnvelope | undefined;
    _reader: FileReader;
    _shpParser: GeomParser;

    /**
     * 
     * @param {FileReader} reader 
     * @param {ShpParser} shpParser
     */
    constructor(reader: FileReader, shpParser: GeomParser) {
        super();

        this.envelope = undefined;
        this._reader = reader;
        this._shpParser = shpParser;
    }

    /**
     * @override
     */
    async next(): Promise<Optional<Geometry | null>> {
        let buffer = <Buffer>await this._reader.read(8);
        if (buffer === null || buffer.length === 0) {
            return this._done();
        }

        const id = buffer.readInt32BE(0);
        const length = buffer.readInt32BE(4) * 2;
        let contentBuffer = <Buffer>await this._reader.read(length);
        if (contentBuffer === null || contentBuffer.length === 0) {
            return this._done();
        }

        let reader = new ShpReader(contentBuffer);
        let content = this._shpParser.read(reader);
        if (content === null) {
            return this._dirty(content);
        }

        let geometry: Geometry | null = null;
        if (_.isUndefined(this.envelope) || (this.envelope && !Envelope.disjoined(content.envelope, this.envelope))) {
            geometry = content.readGeom();
            geometry.id = id;
        }

        return this._continue(geometry);
    }
};