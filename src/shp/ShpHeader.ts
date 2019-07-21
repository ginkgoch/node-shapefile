import fs from 'fs';
import IEnvelope from './IEnvelope';

export default class ShpHeader {
    fileCode: number = 0;
    fileLength: number = 0;
    version: number = 0;
    fileType: number = 0;
    minx: number = 0;
    miny: number = 0;
    maxx: number = 0;
    maxy: number = 0;

    get envelope(): IEnvelope { 
        return { 
            minx: this.minx, 
            miny: this.miny, 
            maxx: this.maxx, 
            maxy: this.maxy 
        };
    }

    static read(fd: number): ShpHeader {
        const buffer = Buffer.alloc(68);
        fs.readSync(fd, buffer, 0, buffer.length, 0);

        const header = new ShpHeader();

        header.fileCode = buffer.readInt32BE(0);
        header.fileLength = buffer.readInt32BE(24) * 2;
        header.version = buffer.readInt32LE(28);
        header.fileType = buffer.readInt32LE(32);
        header.minx = buffer.readDoubleLE(36);
        header.miny = buffer.readDoubleLE(44);
        header.maxx = buffer.readDoubleLE(52);
        header.maxy = buffer.readDoubleLE(60);

        return header;
    }
}