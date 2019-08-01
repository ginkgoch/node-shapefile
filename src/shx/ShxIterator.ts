import Iterator from "../base/Iterator";
import ShxRecord from "./ShxRecord";
import Optional from "../base/Optional";
import { FileReader } from '../shared/FileReader'

const RECORD_LENGTH = 8;

export default class ShxIterator extends Iterator<ShxRecord> {
    reader: FileReader;
    index: number = 0;

    constructor(reader: FileReader, index: number = 0) {
        super();
        this.reader = reader;
        this.index = index;
    }

    /**
     * @override
     */
    next(): Optional<ShxRecord> {
        let buff = this.reader.read(RECORD_LENGTH) as Buffer;
        if (buff === null || buff.length !== RECORD_LENGTH) {
            return this._done();
        }

        this.index++;
        const record = this._buffToRecord(buff, this.index);
        return this._continue(record);
    }

    private _buffToRecord(buff: Buffer, id: number) {
        const offset = buff.readInt32BE(0) * 2;
        const length = buff.readInt32BE(4) * 2;
        return { id, offset, length };
    }
}