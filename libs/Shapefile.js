const fs = require('fs');
const StreamReader = require('ginkgoch-stream-reader');
const Validators = require('./Validators');

module.exports = class Shapefile {
    constructor(filePath) {
        this.filePath = filePath;
        this.isOpened = false;
    }

    async open() {
        if(this.isOpened) return;

        return await new Promise((res, rej) => {
            fs.open(this.filePath, 'r', (err, fd) => {
                if (err) rej(err);

                this._fd = fd;
                this.isOpened = true;
                res();
            });
        })
    }

    async close() {
        if(this.isOpened) {
            return await new Promise((res, rej) => {
                fs.close(this._fd, err => {
                    if(err) rej(err);

                    this.isOpened = false;
                    this._fd = undefined;
                    res();
                });
            });
        }
    }

    async _readHeader() {
        Validators.checkShapefileIsOpened(this.isOpened);

        const stream = fs.createReadStream(null, { fd: this._fd, start: 0, end: 68, highWaterMark: 100 });
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

    async _readRecords() {
        Validators.checkShapefileIsOpened(this.isOpened);

        const stream = fs.createReadStream(null, { fd: this._fd, start: 100 });
        const sr = new StreamReader(stream);
        await sr.open();

        const recordHeader = await this._readRecordHeader(sr);
    }

    async _readRecordHeader(sr) {
        const position = sr.pos;
        const buffer = await sr.read(12);
        const id = buffer.readInt32BE(0);
        const length = buffer.readInt32BE(4) * 2;
        const type = buffer.readInt32LE();


        return { id, length, type, position };
    }
}