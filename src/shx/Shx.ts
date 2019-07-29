import fs from 'fs';
import Openable from '../base/Openable';
import { Validators } from '../shared';

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
        this._flag = flag;
        this._totalSize = 0;
        this.filePath = filePath;
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

    /**
     * Gets the shx records with offset and length information.
     * @param id The id of shx record. Starts from 1.
     */
    get(id: number) {
        const buffer = Buffer.alloc(8);
        fs.readSync(this.__fd, buffer, 0, 8, this._getOffsetById(id));
        const offset = buffer.readInt32BE(0) * 2;
        const length = buffer.readInt32BE(4) * 2;
        return { offset, length };
    }

    /**
     * Remove record at a specific index.
     * @param {number} id The id of shx record. Starts from 1.
     */
    removeAt(id: number) {
        const position = this._getOffsetById(id) + OFFSET_LENGTH;
        const buff = Buffer.alloc(CONTENT_LENGTH);
        buff.writeInt32BE(0, 0);
        fs.writeSync(this.__fd, buff, 0, buff.length, position);
    }

    /**
     * Update record at a specific index.
     * @param id The id of shx record. Starts from 1.
     * @param offset The offset content.
     * @param length The length content.
     */
    updateAt(id: number, offset: number, length: number) {
        Validators.checkIndexIsLEThan(id, this.count());

        const buff = Shx._getRecordBuff(offset, length);
        const position = this._getOffsetById(id);
        fs.writeSync(this.__fd, buff, 0, buff.length, position);
    }

    push(offset: number, length: number) {
        const buff = Shx._getRecordBuff(offset, length);
        fs.writeSync(this.__fd, buff, 0, buff.length, this._totalSize);
        
        this._totalSize += buff.length;
    }

    private static _getRecordBuff(offset: number,  length: number): Buffer {
        const buff = Buffer.alloc(RECORD_LENGTH);
        buff.writeInt32BE(offset * .5, 0);
        buff.writeInt32BE(length * .5, 4);
        return buff
    }

    private get __fd() {
        return <number>this._fd;
    }

    private _getOffsetById(id: number): number {
        return HEADER_LENGTH + (id - 1) * 8
    }
};