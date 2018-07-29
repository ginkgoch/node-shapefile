const fs = require('fs');
const Openable = require('../base/Openable');

const _recordLength = 8;
const _headerLength = 100;

module.exports = class Shx extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    async _open() {
        this._fd = fs.openSync(this.filePath, 'rs');
        const stats = fs.statSync(this.filePath);
        this._totalSize = stats.size;
    }

    async _close() {
        fs.closeSync(this._fd);
        this._fd = undefined;
        this._totalSize = undefined;
    }

    count() {
        return (this._totalSize - _headerLength) / _recordLength;
    }

    get(index) {
        const buffer = Buffer.alloc(8);
        fs.readSync(this._fd, buffer, 0, 8, _headerLength + index * 8);
        const offset = buffer.readInt32BE(0) * 2;
        const length = buffer.readInt32BE(4) * 2;
        return { offset, length };
    }
}