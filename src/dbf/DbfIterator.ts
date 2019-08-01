import _ from 'lodash'
import Optional from '../base/Optional';
import Iterator from "../../src/base/Iterator"
import DbfRecord from '../../src/dbf/DbfRecord'
import DbfHeader from '../../src/dbf/DbfHeader'
import { FileReader } from "../shared/FileReader";

export default class DbfIterator extends Iterator<DbfRecord> {
    fields?: string[]
    _index: number
    _header: DbfHeader
    _streamReader: FileReader
    done: boolean

    constructor(streamReader: FileReader, header: DbfHeader) {
        super();

        this.done = false;
        this.fields = undefined;
        this._index = 0;
        this._header = header;
        this._streamReader = streamReader;
    }

    /**
     * @override
     * @returns {Promise<Optional<DbfRecord>}
     */
    next(): Optional<DbfRecord> {
        this._index++;
        const recordLength = this._header.recordLength;
        const buffer = this._streamReader.read(recordLength);
        if (buffer === null || buffer.length < recordLength) {
            return this._done();
        }

        const record = DbfIterator._readRecord(buffer, this._header, this.fields);
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