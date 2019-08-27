import fs from "fs";
import assert from 'assert';

const CACHE_BLOCK_SIZE = 512;

export class FileStream {
    fd: number;
    cache: Buffer;
    cacheStart = 0;
    position = 0;
    total = 0;
    _requireClose = false;

    constructor(param: string | number, flag: string = 'rs') {
        if (typeof param === 'string') {
            assert(fs.existsSync(param), `File doesn't exist - ${param}`)
            this.fd = fs.openSync(param, flag);
            this._requireClose = true;
        } else {
            this.fd = param
        }

        this.total = fs.fstatSync(this.fd).size;
        this.cache = Buffer.alloc(0);
    }

    read(length: number) {
        let cacheRange = { from: this.cacheStart, to: this.cacheStart + this.cache.length };
        if ((this.position < cacheRange.from || this.position >= cacheRange.to) || (this.position + length > cacheRange.to)) {
            let requestLength = Math.max(length, CACHE_BLOCK_SIZE);

            if (this.position + CACHE_BLOCK_SIZE > this.total) {
                requestLength = this.total - this.position;
            }

            this.cacheStart = this.position;
            this.cache = Buffer.alloc(requestLength);
            fs.readSync(this.fd, this.cache, 0, requestLength, this.position);
        }

        const buffOffset = this.position - this.cacheStart;
        const buff = this.cache.slice(buffOffset, buffOffset + length);
        this.position += buff.length;
        return buff;
    }

    seek(offset: number, origin: 'begin' | 'current' | 'end' = 'begin') {
        switch (origin) {
            case 'current':
                this.position += offset;
                break;
            case 'end':
                const size = fs.fstatSync(this.fd).size;
                this.position = size - offset;
                break;
            case 'begin':
            default:
                this.position = offset;
                break;
        }
    }

    write(buff: Buffer, offset = 0, length = buff.length) {
        const writtenLength = fs.writeSync(this.fd, buff, offset, length, this.position);
        this.position += writtenLength;
        if (this.position > this.total) {
            this.total  = this.position;
        }
    }

    close() {
        if (this._requireClose) {
            fs.closeSync(this.fd);
        }

        this.total = 0;
        this.position = 0;
        this.cacheStart = 0;
        this._requireClose = false;
        this.cache = Buffer.alloc(0);
    }

    invalidCache() {
        this.position = 0;
        this.cacheStart = 0;
        this.cache = Buffer.alloc(0);
        this.total = fs.fstatSync(this.fd).size;
    }
}