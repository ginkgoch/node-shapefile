import fs from 'fs';
import ShxRecord from './ShxRecord';
import ShxIterator from './ShxIterator';
import FilterUtils from '../shared/FilterUtils';
import { Validators, Constants } from '../shared';
import IQueryFilter from '../shared/IQueryFilter';
import Opener from '../base/Openable';
import { FileStream } from '../shared/FileStream';

export default class Shx extends Opener {
    filePath: string
    _flag: string
    _fd?: number
    _totalSize: number
    _stream?: FileStream

    constructor(filePath: string, flag = 'rs') {
        super();
        this._flag = flag;
        this._totalSize = 0;
        this.filePath = filePath;
    }

    /**
     * @override
     */
    _open() {
        this._fd = fs.openSync(this.filePath, this._flag);
        const stats = fs.statSync(this.filePath);
        this._totalSize = stats.size;
        this._stream = new FileStream(this._fd);
    }

    /**
     * @override
     */
    _close() {
        this._totalSize = 0;

        this.__reader.close();
        this._stream = undefined;

        this._fd && fs.closeSync(this._fd);
        this._fd = undefined;
    }

    count() {
        return (this._totalSize - Constants.SIZE_SHX_HEADER) / Constants.SIZE_SHX_RECORD;
    }

    /**
     * Gets the shx records with offset and length information.
     * @param id The id of shx record. Starts from 1.
     */
    get(id: number) {
        this.__reader.seek(this._getOffsetById(id));
        const buffer = this.__reader.read(Constants.SIZE_SHX_RECORD);

        const offset = buffer.readInt32BE(0) * 2;
        const length = buffer.readInt32BE(4) * 2;
        return { id, offset, length };
    }

    records(filter?: IQueryFilter): Array<ShxRecord> {
        const records = new Array<ShxRecord>();
        const count = this.count();
        const filterOption = FilterUtils.normalizeFilter(filter);
        let to = filterOption.from + filterOption.limit;
        if (to > count + 1) {
            to = count + 1;
        }
        for (let i = filterOption.from; i < to; i++) {
            const record = this.get(i);
            if (record.length > 0) {
                records.push(record);
            }
        }

        return records;
    }

    iterator() {
        return new ShxIterator(this.__fd);
    }

    /**
     * Remove record by id.
     * @param {number} id The id of shx record. Starts from 1.
     */
    remove(id: number) {
        const position = this._getOffsetById(id) + Constants.SIZE_SHX_OFFSET;
        const buff = Buffer.alloc(Constants.SIZE_SHX_CONTENT);
        buff.writeInt32BE(0, 0);
        fs.writeSync(this.__fd, buff, 0, buff.length, position);
        this._invalidCache();
    }

    /**
     * Update record by id.
     * @param id The id of shx record. Starts from 1.
     * @param offset The offset content.
     * @param length The length content.
     */
    update(record: ShxRecord) {
        let { id, offset, length } = record;
        Validators.checkIndexIsLEThan(id, this.count());

        const buff = Shx._getRecordBuff(offset, length);
        const position = this._getOffsetById(id);
        fs.writeSync(this.__fd, buff, 0, buff.length, position);
        this._invalidCache();
    }

    push(offset: number, length: number) {
        const buff = Shx._getRecordBuff(offset, length);
        fs.writeSync(this.__fd, buff, 0, buff.length, this._totalSize);
        this._invalidCache();

        this._totalSize += buff.length;
    }

    _invalidCache() {
        this.__reader.invalidCache();
    }

    private static _getRecordBuff(offset: number, length: number): Buffer {
        const buff = Buffer.alloc(Constants.SIZE_SHX_RECORD);
        buff.writeInt32BE(offset * .5, 0);
        buff.writeInt32BE(length * .5, 4);
        return buff
    }

    private _getOffsetById(id: number): number {
        return Constants.SIZE_SHX_HEADER + (id - 1) * 8
    }

    private get __fd() {
        return <number>this._fd;
    }

    private get __reader() {
        return <FileStream>this._stream;
    }
};