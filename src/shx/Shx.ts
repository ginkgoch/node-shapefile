// const fs = require('fs');
// const Openable = require('../base/Openable');
import fs from 'fs';
import Openable from '../base/Openable';

const RECORD_LENGTH = 8;
const HEADER_LENGTH = 100;
const OFFSET_LENGTH = 4;
const CONTENT_LENGTH = 4;

export default class Shx extends Openable {
    filePath: string
    _flag: string
    _fd?: number
    _totalSize: number

    constructor(filePath: string, flag = 'rs') {
        super();
        this.filePath = filePath;
        this._flag = flag;
        this._totalSize = 0;
    }

    private get __fd() {
        return <number>this._fd;
    }

    async _open() {
        this._fd = fs.openSync(this.filePath, this._flag);
        const stats = fs.statSync(this.filePath);
        this._totalSize = stats.size;
    }

    async _close() {
        this._fd && fs.closeSync(this._fd);
        this._fd = undefined;
        this._totalSize = 0;
    }

    count() {
        return (this._totalSize - HEADER_LENGTH) / RECORD_LENGTH;
    }

    get(index: number) {
        const buffer = Buffer.alloc(8);
        fs.readSync(this.__fd, buffer, 0, 8, HEADER_LENGTH + index * 8);
        const offset = buffer.readInt32BE(0) * 2;
        const length = buffer.readInt32BE(4) * 2;
        return { offset, length };
    }

    /**
     * Remove record at a specific index.
     * @param {number} index
     */
    removeAt(index: number) {
        const position = HEADER_LENGTH + RECORD_LENGTH * index + OFFSET_LENGTH;
        const buff = Buffer.alloc(CONTENT_LENGTH);
        buff.writeInt32BE(0, 0);
        fs.writeSync(this.__fd, buff, 0, buff.length, position);
    }
};