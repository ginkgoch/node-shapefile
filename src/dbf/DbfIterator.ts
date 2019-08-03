import _ from 'lodash'
import Optional from '../base/Optional';
import Iterator from "../base/Iterator"
import DbfRecord from '../dbf/DbfRecord'
import DbfHeader from '../dbf/DbfHeader'
import { FileStream } from "../shared/FileStream";
import IQueryFilter from '../shared/IQueryFilter';
import FilterUtils from '../shared/FilterUtils';

export default class DbfIterator extends Iterator<DbfRecord> {
    _index: number
    _header: DbfHeader
    _stream: FileStream
    _filter: { from: number, limit: number, to: number, fields?: string[] };

    constructor(fd: number, header: DbfHeader, filter?: IQueryFilter) {
        super();

        let filterOption = FilterUtils.normalizeFilter(filter, () => header.fields.map(f => f.name));
        this._filter = _.assign(filterOption, { to: filterOption.from + filterOption.limit });

        this._index = this._filter.from - 1;
        this._header = header;
        this._stream = new FileStream(fd);

        let position = this._header.headerLength + this._header.recordLength * this._index;
        this._stream.seek(position);
    }

    /**
     * @override
     * @returns {Promise<Optional<DbfRecord>}
     */
    next(): Optional<DbfRecord> {
        this._index++;

        if (this._index >= this._filter.to) {
            return this._done();
        }

        const recordLength = this._header.recordLength;
        const buffer = this._stream.read(recordLength);
        if (buffer === null || buffer.length < recordLength) {
            return this._done();
        }

        const record = DbfIterator._readRecord(buffer, this._header, this._filter.fields);
        record.id = this._index;
        return this._continue(record);
    }

    /**
     *
     * @param {Buffer} buffer
     * @param {DbfHeader} header
     * @param {Array<string>} fieldNames
     * @returns {DbfRecord}
     */
    static _readRecord(buffer: Buffer, header: DbfHeader, fieldNames?: string[]): DbfRecord {
        const record = new DbfRecord(header).read(buffer);
        if (fieldNames) {
            record.filter(fieldNames);
        }
        return record;
    }
};