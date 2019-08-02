import Iterator from "../base/Iterator";
import ShxRecord from "./ShxRecord";
import Optional from "../base/Optional";
import { FileStream } from '../shared/FileStream'
import { Constants } from "../shared";
import IQueryFilter from "../shared/IQueryFilter";
import FilterUtils from "../shared/FilterUtils";
import _ from "lodash";

export default class ShxIterator extends Iterator<ShxRecord> {
    _stream: FileStream;
    _index: number = 0;
    _filter: { from: number, limit: number, to: number };

    constructor(fd: number, filter?: IQueryFilter) {
        super();

        this._stream = new FileStream(fd);

        let filterNorm = FilterUtils.normalizeFilter(filter);
        this._filter = _.assign(filterNorm, { to: filterNorm.from + filterNorm.limit });

        this._index = this._filter.from - 1;
        let position = Constants.SIZE_SHX_HEADER + Constants.SIZE_SHX_RECORD * this._index;
        this._stream.seek(position);
    }

    /**
     * @override
     */
    next(): Optional<ShxRecord> {
        this._index++;

        if (this._index >= this._filter.to) {
            return this._done();
        }

        let buff = this._stream.read(Constants.SIZE_SHX_RECORD) as Buffer;
        if (buff === null || buff.length !== Constants.SIZE_SHX_RECORD) {
            return this._done();
        }

        const record = this._readRecord(buff, this._index);
        return this._continue(record);
    }

    private _readRecord(buff: Buffer, id: number) {
        const offset = buff.readInt32BE(0) * 2;
        const length = buff.readInt32BE(4) * 2;
        return { id, offset, length };
    }
}