import fs from 'fs';
import ShxRecord from './ShxRecord';
import { Validators } from '../shared';
import IQueryFilter from '../shared/IQueryFilter';
import StreamOpenable from '../base/StreamOpenable';
import { FileReader } from '../shared/FileReader';

const RECORD_LENGTH = 8;
const HEADER_LENGTH = 100;
const OFFSET_LENGTH = 4;
const CONTENT_LENGTH = 4;

export default class Shx extends StreamOpenable {
    filePath: string
    _flag: string
    _fd?: number
    _totalSize: number
    _reader?: FileReader

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
        this._reader = new FileReader(this._fd);
    }

    async _close() {
        this._totalSize = 0;

        this.__reader.close();
        this._reader = undefined;

        this._fd && fs.closeSync(this._fd);
        this._fd = undefined;
    }

    count() {
        return (this._totalSize - HEADER_LENGTH) / RECORD_LENGTH;
    }

    /**
     * Gets the shx records with offset and length information.
     * @param id The id of shx record. Starts from 1.
     */
    get(id: number) {
        this.__reader.seek(this._getOffsetById(id));
        const buffer = this.__reader.read(RECORD_LENGTH);
        const offset = buffer.readInt32BE(0) * 2;
        const length = buffer.readInt32BE(4) * 2;
        return { id, offset, length };
    }

    async records(filter?: IQueryFilter): Promise<Array<ShxRecord>> {
        const reader = fs.createReadStream(this.filePath, this._getStreamOption(100));
        return new Promise(res => {
            const records = new Array<ShxRecord>();
            const filterOption = this._normalizeFilter(filter);
            const filterTo = filterOption.from + filterOption.limit;
            reader.on('readable', () => {
                let id = 1;
                let buff = reader.read(RECORD_LENGTH) as Buffer;
                while (buff !== null && buff.length === RECORD_LENGTH) {
                    const record = this._buffToRecord(buff, id);
                    if (record.length > 0 && id >= filterOption.from && id < filterTo) {
                        records.push(record);
                    }

                    id++;
                    buff = reader.read(RECORD_LENGTH);
                }
            }).on('end', () => {
                res(records);
            });
        });
    }

    private _buffToRecord(buff: Buffer, id: number) {
        const offset = buff.readInt32BE(0) * 2;
        const length = buff.readInt32BE(4) * 2;
        return { id, offset, length };
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
        this._invalidCache();
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
        const buff = Buffer.alloc(RECORD_LENGTH);
        buff.writeInt32BE(offset * .5, 0);
        buff.writeInt32BE(length * .5, 4);
        return buff
    }

    private _getOffsetById(id: number): number {
        return HEADER_LENGTH + (id - 1) * 8
    }

    private get __fd() {
        return <number>this._fd;
    }

    private get __reader() {
        return <FileReader>this._reader;
    }
};