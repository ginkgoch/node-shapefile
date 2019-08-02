import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import assert = require('assert');
import { EventEmitter } from "events";
import { Envelope, IEnvelope, Geometry } from 'ginkgoch-geom';

import Shx from '../shx/Shx';
import ShpHeader from './ShpHeader';
import Optional from '../base/Optional';
import ShpIterator from './ShpIterator';
import Opener from '../base/Openable';
import GeomParser from './parser/GeomParser';
import { FileStream } from '../shared/FileStream';
import IQueryFilter from '../shared/IQueryFilter';
import GeomParserFactory from './parser/GeomParserFactory';
import { Validators, ShapefileType, Constants } from "../shared";

export default class Shp extends Opener {
    filePath: string;
    _flag: string;
    _fd: number | undefined;
    _header: undefined | ShpHeader;
    _shpParser: Optional<GeomParser>;
    _shx: Optional<Shx>;
    _eventEmitter: EventEmitter | undefined;
    _reader: FileStream | undefined;

    constructor(filePath: string, flag = 'rs') {
        super();
        this.filePath = filePath;
        this._flag = flag;
        this._shpParser = new Optional<GeomParser>();
        this._shx = new Optional<Shx>();
    }

    private get __fd() {
        return <number>this._fd;
    }

    private get __header() {
        return <ShpHeader>this._header;
    }

    private get __shpParser() {
        return this._shpParser.value;
    }

    private get __shx() {
        return this._shx.value;
    }

    private get __reader() {
        return <FileStream>this._reader;
    }

    /**
     * @override
     */
    _open() {
        Validators.checkFileExists(this.filePath, ['.shp', '.shx']);

        this._fd = fs.openSync(this.filePath, this._flag);
        this._header = this._readHeader();
        this._shpParser = GeomParserFactory.create(this.__header.fileType);
        this._reader = new FileStream(this._fd);

        const filePathShx = this.filePath.replace(Constants.FILE_EXT_REG, '.shx');
        if (fs.existsSync(filePathShx)) {
            this._shx.update(new Shx(filePathShx, this._flag));
            this.__shx.open();
        }
    }

    /**
     * @override
     */
    _close() {
        this.__reader.close();
        fs.closeSync(this.__fd);
        this._fd = undefined;
        this._header = undefined;
        this._reader = undefined;
        this._shpParser.update(undefined);

        if (this._shx) {
            this.__shx.close();
            this._shx.update(undefined);
        }
    }

    _readHeader() {
        Validators.checkIsOpened(this.isOpened);
        const header = ShpHeader.read(this.__fd);
        return header;
    }

    envelope() {
        Validators.checkIsOpened(this.isOpened);

        return new Envelope(
            this.__header.envelope.minx,
            this.__header.envelope.miny,
            this.__header.envelope.maxx,
            this.__header.envelope.maxy);
    }

    count() {
        Validators.checkIsOpened(this.isOpened);
        return this.__shx.count();
    }

    shapeType(): ShapefileType {
        Validators.checkIsOpened(this.isOpened);

        return this.__header.fileType;
    }

    iterator(filter?: IQueryFilter) {
        Validators.checkIsOpened(this.isOpened);

        return new ShpIterator(this.__fd, this.__shx, this.__shpParser, filter);
    }

    /**
     * Gets shp record by id.
     * @param id The record id. Starts from 1.
     */
    get(id: number): Geometry | null {
        Validators.checkIsOpened(this.isOpened);

        const shxRecord = this.__shx.get(id);
        if (shxRecord.length === 0) {
            return null;
        }

        const iterator = this.iterator({ from: id, limit: 1 });
        const record = iterator.next();
        return record.value;
    }

    records(filter?: IQueryFilter): Array<Geometry> {
        Validators.checkIsOpened(this.isOpened);

        const count = this.count();
        const records = new Array<Geometry>();
        const iterator = this.iterator(filter);
        const from = iterator._filter.from;
        const to = iterator._filter.to > count + 1 ? count + 1 : iterator._filter.to;
        
        let index = 0;
        const total = to - from;

        let record = iterator.next();
        while (!iterator.done) {
            index++;
            if (record.value !== null) {
                records.push(record.value);
            }

            if (this._eventEmitter) {
                this._eventEmitter.emit('progress', index, total);
            }

            record = iterator.next();
        }

        return records;
    }

    static _matchFilter(filter: IQueryFilter | null | undefined, recordEnvelope: IEnvelope): boolean {
        return filter === null || filter === undefined || _.isUndefined(filter.envelope) || (filter.envelope && !Envelope.disjoined(recordEnvelope, filter.envelope));
    }

    /**
     * Remove record by a specific id.
     * @param {number} id The shp record id. Starts from 1.
     */
    remove(id: number) {
        Validators.checkIsOpened(this.isOpened);

        const recordShx = this.__shx.get(id);
        if (recordShx && recordShx.length > 0) {
            this.__shx.remove(id);

            const buff = Buffer.alloc(4);
            buff.writeInt32LE(0, 0);

            // write record length to  0.
            const position = recordShx.offset + 4;
            fs.writeSync(this.__fd, buff, 0, buff.length, position);

            this._invalidCache();
        }
    }

    //TODO: check whether the geometry is changed. Otherwise, we should not push new geometry.
    /**
     * Update geometry by a specific record id.
     * @param id The record id to update. Starts from 1.
     * @param geometry The geometry to update.
     */
    update(id: number, geometry: Geometry) {
        Validators.checkIsOpened(this.isOpened);

        const record = this._push(geometry, id);
        this.__shx.update({ id, offset: record.offset, length: record.geomBuff.length });
    }

    push(geometry: Geometry) {
        Validators.checkIsOpened(this.isOpened);

        const record = this._push(geometry);
        this.__shx.push(record.offset, record.geomBuff.length);
    }

    _push(geometry: Geometry, id?: number): { geomBuff: Buffer, offset: number } {
        const parser = GeomParserFactory.create(this.__header.fileType);
        const geomBuff = parser.value.getGeomBuff(geometry);
        const recBuff = Buffer.alloc(geomBuff.length + 8);

        const currentId = id === undefined ? this.__shx.count() + 1 : id;
        recBuff.writeInt32BE(currentId, 0);
        recBuff.writeInt32BE(geomBuff.length / 2, 4);
        geomBuff.copy(recBuff, 8);

        const offset = this.__header.fileLength;
        fs.writeSync(this.__fd, recBuff, 0, recBuff.length, offset);
        this._updateHeader(geometry, recBuff.length);
        this.__reader.invalidCache();

        return { geomBuff, offset };
    }

    static createEmpty(filePath: string, fileType: ShapefileType): Shp {
        const header = new ShpHeader();
        header.fileType = fileType;

        const headerBuff = Buffer.alloc(Constants.SIZE_SHP_HEADER);
        header._write(headerBuff);

        fs.writeFileSync(filePath, headerBuff);
        fs.copyFileSync(filePath, filePath.replace(/(.shp)$/g, '.shx'));

        const shp = new Shp(filePath, 'rs+');
        return shp;
    }

    _invalidCache() {
        this.__reader.invalidCache();
    }

    private _updateHeader(geom: Geometry, geomLength: number) {
        this.__header.fileLength += geomLength;
        const geomEnvelope = geom.envelope();
        this.__header.envelope = Envelope.union(this.__header.envelope, geomEnvelope);
        this.__header.write(this.__fd);
        this.__header.write(this.__shx._fd as number);
        this.__shx._invalidCache();
    }
};