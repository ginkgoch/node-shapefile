const fs = require('fs');
const _ = require('lodash');
const StreamReader = require('ginkgoch-stream-reader');
const Validators = require('./Validators');
const RecordParser = require('./RecordParser');
const RecordIterator = require('./RecordIterator');
const Openable = require('./Openable');
const Shx = require('./shx/Shx');
const Dbf = require('./dbf/Dbf');
const extReg = /\.\w+$/;

module.exports = class Shapefile extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    /**
     * @override
     */
    async _open() {
        Validators.checkFileExists(this.filePath);

        this._fd = fs.openSync(this.filePath, 'r');
        this._header = await this._readHeader();
        this._recordParser = RecordParser.getParser(this._header.fileType);

        const filePathShx = this.filePath.replace(extReg, '.shx');
        this._shx = new Shx(filePathShx);
        await this._shx.open();

        const filePathDbf = this.filePath.replace(extReg, '.dbf');
        this._dbf = new Dbf(filePathDbf);
        await this._dbf.open();
    }

    /**
     * @override
     */
    async _close() {
        fs.closeSync(this._fd);
        this._fd = undefined;
        this._header = undefined;
        this._recordParser = undefined;
        
        if(this._shx) {
            await this._shx.close();
            this._shx = undefined;
        }

        if(this._dbf) {
            await this._dbf.close();
            this._dbf = undefined;
        }
    } 

    async _readHeader() {
        Validators.checkIsOpened(this.isOpened);

        const stream = fs.createReadStream(null, {
            fd: this._fd,
            autoClose: false,
            start: 0,
            end: 68,
            highWaterMark: 100
        });
        const sr = new StreamReader(stream);
        await sr.open();
        const buffer = await sr.read();

        const fileCode = buffer.readInt32BE(0);
        const fileLength = buffer.readInt32BE(24) * 2;
        const version = buffer.readInt32LE(28);
        const fileType = buffer.readInt32LE(32);
        const minx = buffer.readDoubleLE(36);
        const miny = buffer.readDoubleLE(44);
        const maxx = buffer.readDoubleLE(52);
        const maxy = buffer.readDoubleLE(60);
        return await Promise.resolve({
            fileCode,
            fileLength,
            version,
            fileType,
            envelope: { minx, miny, maxx, maxy }
        });
    }

    async readRecords() {
        Validators.checkIsOpened(this.isOpened);
       
        const option = this._getStreamOption(100);
        return await this._getRecordIteractor(option);
    }

    async _get(id) {
        const rshx = this._shx.get(id);
        const option = this._getStreamOption(rshx.offset, rshx.offset + 8 + rshx.length);
        const iterator = await this._getRecordIteractor(option);
        const result = await iterator.next();
        return _.omit(result, ['done']);
    }

    async _getRecordIteractor(optionShp) { 
        const stream = fs.createReadStream(null, optionShp);
        const sr = new StreamReader(stream);
        await sr.open();
        return new RecordIterator(sr, this._recordParser);
    }

    _getStreamOption(start, end) {
        return _.pickBy({ fd: this._fd, autoClose: false, start, end }, i => !_.isUndefined(i));
    }
}