import Iterator from "../base/Iterator";
import ShxRecord from "./ShxRecord";
import Optional from "../base/Optional";
import { FileReader } from '../shared/FileReader'
import { Constants } from "../shared";
import IQueryFilter from "../shared/IQueryFilter";
import FilterUtils from "../shared/FilterUtils";
import _ from "lodash";

export default class ShxIterator extends Iterator<ShxRecord> {
    reader: FileReader;
    index: number = 0;
    filter: { from: number, limit: number, to: number };

    constructor(fd: number, filter?: IQueryFilter) {
        super();

        this.reader = new FileReader(fd);

        let filterNorm = FilterUtils.normalizeFilter(filter);
        this.filter = _.assign(filterNorm, { to: filterNorm.from + filterNorm.limit });

        this.index = this.filter.from - 1;
        let position = Constants.SIZE_SHX_HEADER + Constants.SIZE_SHX_RECORD * this.index;
        this.reader.seek(position);
    }

    /**
     * @override
     */
    next(): Optional<ShxRecord> {
        this.index++;

        if (this.index >= this.filter.to) {
            return this._done();
        }

        let buff = this.reader.read(Constants.SIZE_SHX_RECORD) as Buffer;
        if (buff === null || buff.length !== Constants.SIZE_SHX_RECORD) {
            return this._done();
        }

        const record = this._readRecord(buff, this.index);
        return this._continue(record);
    }

    private _readRecord(buff: Buffer, id: number) {
        const offset = buff.readInt32BE(0) * 2;
        const length = buff.readInt32BE(4) * 2;
        return { id, offset, length };
    }
}