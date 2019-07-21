import fs from 'fs';
import path from 'path';
import assert = require('assert');
import { EventEmitter } from "events";

import _ from 'lodash';
import { StreamReader } from 'ginkgoch-stream-io';

import { Validators } from "../shared";
import ShpHeader from './ShpHeader';
import GeomParser from './parser/GeomParser';
import GeomParserFactory from './parser/GeomParserFactory';
import Optional from '../base/Optional';
import Shx from '../shx/Shx';
import Envelope from './Envelope';
import StreamOpenable from '../base/StreamOpenable';
import ShpIterator from './ShpIterator';
import ShpReader from './ShpReader';
import IEnvelope from './IEnvelope';

const extReg = /\.\w+$/;

export default class Shp extends StreamOpenable {
    filePath: string;
    _flag: string;
    _fd: number|undefined;
    _header: undefined|ShpHeader;
    _shpParser: Optional<GeomParser>;
    _shx: Optional<Shx>;
    _eventEmitter: EventEmitter|undefined;

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

    /**
     * @override
     */
    async _open() {
        Validators.checkFileExists(this.filePath);

        this._fd = fs.openSync(this.filePath, this._flag);
        this._header = await this._readHeader();
        this._shpParser = GeomParserFactory.getParser(this.__header.fileType);

        const filePathShx = this.filePath.replace(extReg, '.shx');
        if(fs.existsSync(filePathShx)) {
            this._shx.update(new Shx(filePathShx, this._flag));
            await this.__shx.open();
        }
    }

    /**
     * @override
     */
    async _close() {
        fs.closeSync(this.__fd);
        this._fd = undefined;
        this._header = undefined;
        this._shpParser.update(undefined);
        
        if(this._shx) {
            await this.__shx.close();
            this._shx.update(undefined);
        }
    } 

    async _readHeader() {
        Validators.checkIsOpened(this.isOpened);
        const header = ShpHeader.read(this.__fd);
        return await Promise.resolve(header);
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

    async iterator() {
        Validators.checkIsOpened(this.isOpened);
        return await this._getRecordIterator(100);
    }

    async get(id: number) {
        const shxPath = this.filePath.replace(extReg, '.shx');
        assert(!_.isUndefined(this._shx), `${path.basename(shxPath)} doesn't exist.`);

        const shxRecord = this.__shx.get(id);
        if (shxRecord.length === 0) {
            return null;
        }

        const iterator = await this._getRecordIterator(shxRecord.offset, shxRecord.offset + 8 + shxRecord.length);
        const result = await iterator.next();
        return result.value;
    }

    async records(filter?: { from?: number, limit?: number, fields?: string[], envelope?: IEnvelope }): Promise<{id: number, geometry: any}[]> {
        Validators.checkIsOpened(this.isOpened);

        const option = this._getStreamOption(100);
        const stream = fs.createReadStream(this.filePath, option);
        const records: Array<{id: number, geometry: any}> = [];
        const total = this.count();

        const filterNorm = this._normalizeFilter(filter);
        const to = filterNorm.from + filterNorm.limit;

        return await new Promise(resolve => {
            let index = -1, readableTemp: Buffer|null = null;
            stream.on('readable', () => {
                let buffer = readableTemp || stream.read(8);
                while (null !== buffer) {
                    if (readableTemp === null) { 
                        index++; 
                        if (this._eventEmitter) {
                            this._eventEmitter.emit('progress', index + 1, total);
                        }
                    }

                    const id = buffer.readInt32BE(0);
                    const length = buffer.readInt32BE(4) * 2;

                    const contentBuffer = stream.read(length);
                    if (contentBuffer === null || contentBuffer.length === 0) { 
                        readableTemp = buffer;
                        break; 
                    } 
                    else {
                        readableTemp = null;
                    }

                    if (index >= filterNorm.from && index < to) { 
                        let reader = new ShpReader(contentBuffer);
                        let recordReader = this.__shpParser.prepare(reader);
                        if (recordReader === null) {
                            continue;
                        }

                        if (filter === null || 
                            filter === undefined || 
                            _.isUndefined(filter.envelope) || 
                            (filter.envelope && !Envelope.disjoined(recordReader.envelope, filter.envelope))) {
                            const record = { id: id, geometry: recordReader.readGeom() };
                            records.push(record);
                        }
                    }

                    buffer = stream.read(8);
                }

            }).on('end', () => {
                resolve(records);
            });
        });
    }

    async _getRecordIterator(start?: number, end?: number) {
        const option = this._getStreamOption(start, end);
        const stream = fs.createReadStream(this.filePath, option);
        const sr = new StreamReader(stream);
        await sr.open();
        return new ShpIterator(sr, this.__shpParser);
    }

    /**
     * Remove record at a specific index.
     * @param {number} index
     */
    removeAt(index: number) {
        const recordShx = this.__shx.get(index);
        if (recordShx && recordShx.length > 0) {
            this.__shx.removeAt(index);

            const buff = Buffer.alloc(4);
            buff.writeInt32LE(0, 0);

            const position = recordShx.offset + 8;
            fs.writeSync(this.__fd, buff, 0, buff.length, position);
        }
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
};