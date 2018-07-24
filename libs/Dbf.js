const fs = require('fs');
const StreamReader = require('ginkgoch-stream-reader');
const Openable = require('./Openable');
const Validators = require('./Validators');
const RecordReader = require('./RecordReader');

module.exports = class Dbf extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.fileType = 0x03;
        this.fileDescriptorSize = 33;
        this.columnDescriptorSize = 32;
    }

    /**
     * @override
     */
    async _open() {
        this._fd = fs.openSync(this.filePath, 'r');
        this._header = await this._readHeader();
    }

    /**
     * @override
     */
    async _close() {
        fs.closeSync(this._fd);
    }

    async _readHeader() {
        Validators.checkIsOpened(this.isOpened);

        const stream = fs.createReadStream(null, { fd: this._fd });
        const sr = new StreamReader(stream);
        const buffer = await sr.read(32);
        const br = new RecordReader(buffer);

        const fileType = br.nextInt8();
        const year = await br.nextInt8();
        const month = await br.nextInt8();
        const day = await br.nextInt8();
        const date = new Date(year + 1900, month, day);
        
        const numRecords = br.nextUInt32LE();
        const headerLength = br.nextUInt16LE();
        const recordLength = br.nextUInt16LE();

        br.seek(20, false);
    }
}