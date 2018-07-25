const fs = require('fs');
const StreamReader = require('ginkgoch-stream-reader');
const Validators = require('./Validators');
const RecordParser = require('./RecordParser');
const RecordIterator = require('./RecordIterator');
const Openable = require('./Openable');

module.exports = class Shapefile extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    /**
     * @override
     */
    async _open() {
        this._fd = fs.openSync(this.filePath, 'r');
        this._header = await this._readHeader();
        this._recordParser = RecordParser.getParser(this._header.fileType);
    }

    /**
     * @override
     */
    async _close() {
        fs.closeSync(this._fd);
        this._fd = undefined;
        this._header = undefined;
        this._recordParser = undefined;
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
        const stream = fs.createReadStream(null, {
            fd: this._fd,
            start: 100,
            autoClose: false,
            highWaterMark: 65535
        });
        const sr = new StreamReader(stream);
        await sr.open();

        return new RecordIterator(sr, this._recordParser);
    }
}