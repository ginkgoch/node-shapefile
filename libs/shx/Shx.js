const fs = require('fs');
const Openable = require('../base/Openable');

const RECORD_LENGTH = 8;
const HEADER_LENGTH = 100;
const OFFSET_LENGTH = 4;
const CONTENT_LENGTH = 4;

module.exports = class Shx extends Openable {
    constructor(filePath, flag = 'rs') {
        super();
        this.filePath = filePath;
        this._flag = flag;
    }

    async _open() {
        this._fd = fs.openSync(this.filePath, this._flag);
        const stats = fs.statSync(this.filePath);
        this._totalSize = stats.size;
    }

    async _close() {
        fs.closeSync(this._fd);
        this._fd = undefined;
        this._totalSize = undefined;
    }

    count() {
        return (this._totalSize - HEADER_LENGTH) / RECORD_LENGTH;
    }

    get(index) {
        const buffer = Buffer.alloc(8);
        fs.readSync(this._fd, buffer, 0, 8, HEADER_LENGTH + index * 8);
        const offset = buffer.readInt32BE(0) * 2;
        const length = buffer.readInt32BE(4) * 2;
        return { offset, length };
    }

    /**
     * Remove record at a specific index.
     * @param {number} index
     */
    removeAt(index) {
        const position = HEADER_LENGTH + RECORD_LENGTH * index + OFFSET_LENGTH;
        const buff = Buffer.alloc(CONTENT_LENGTH);
        buff.writeInt32BE(0, 0);
        fs.writeSync(this._fd, buff, 0, buff.length, position);
    }
};