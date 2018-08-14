const fs = require('fs');
const path = require('path');
const assert = require('assert');
const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const Validators = require('../Validators');
const ShpParser = require('./ShpParser');
const ShpIterator = require('./ShpIterator');
const Openable = require('../base/StreamOpenable');
const Shx = require('../shx/Shx');
const Envelope = require('./Envelope');
const extReg = /\.\w+$/;

module.exports = class Shp extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    /**
     * @override
     */
    async _open() {
        Validators.checkFileExists(this.filePath);

        this._fd = fs.openSync(this.filePath, 'rs');
        this._header = await this._readHeader();
        this._shpParser = ShpParser.getParser(this._header.fileType);

        const filePathShx = this.filePath.replace(extReg, '.shx');
        if(fs.existsSync(filePathShx)) {
            this._shx = new Shx(filePathShx);
            await this._shx.open();
        }
    }

    /**
     * @override
     */
    async _close() {
        fs.closeSync(this._fd);
        this._fd = undefined;
        this._header = undefined;
        this._shpParser = undefined;
        
        if(this._shx) {
            await this._shx.close();
            this._shx = undefined;
        }
    } 

    async _readHeader() {
        Validators.checkIsOpened(this.isOpened);
        const buffer = Buffer.alloc(68);
        fs.readSync(this._fd, buffer, 0, buffer.length, 0);

        const fileCode = buffer.readInt32BE(0);
        const fileLength = buffer.readInt32BE(24) * 2;
        const version = buffer.readInt32LE(28);
        const fileType = buffer.readInt32LE(32);
        const minx = buffer.readDoubleLE(36);
        const miny = buffer.readDoubleLE(44);
        const maxx = buffer.readDoubleLE(52);
        const maxy = buffer.readDoubleLE(60);
        const header = { fileCode, fileLength, version, fileType, envelope: { minx, miny, maxx, maxy } };

        return await Promise.resolve(header);
    }

    envelope() {
        Validators.checkIsOpened(this.isOpened);
        return new Envelope(this._header.envelope.minx, this._header.envelope.miny, this._header.envelope.maxx, this._header.envelope.maxy);
    }

    count() {
        Validators.checkIsOpened(this.isOpened);
        return this._shx.count();
    }

    async iterator() {
        Validators.checkIsOpened(this.isOpened);
        return await this._getRecordIteractor(100);
    }

    async get(id) {
        const shxPath = this.filePath.replace(extReg, '.shx');
        assert(!_.isUndefined(this._shx), `${path.basename(shxPath)} doesn't exist.`)

        const rshx = this._shx.get(id);
        const iterator = await this._getRecordIteractor(rshx.offset, rshx.offset + 8 + rshx.length);
        const result = await iterator.next();
        return result.result;
    }

    async records(filter) {
        const option = this._getStreamOption(100);
        const stream = fs.createReadStream(this.filePath, option);
        const records = [];

        filter = this._normalizeFilter(filter);
    }

    async _getRecordIteractor(start, end) { 
        const option = this._getStreamOption(start, end);
        const stream = fs.createReadStream(this.filePath, option);
        const sr = new StreamReader(stream);
        await sr.open();
        return new ShpIterator(sr, this._shpParser);
    }
}