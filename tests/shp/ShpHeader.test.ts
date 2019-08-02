import ShpHeader from "../../src/shp/ShpHeader";

describe('ShpHeader', () => {
    it('read/write', ()  => {
        const header = new ShpHeader();
        header.fileCode = 3;
        header.fileLength = 123456;
        header.version = 4;
        header.fileType = 8;
        header.minx = 56;
        header.miny = -40;
        header.maxx = 179;
        header.maxy = 89;

        const buff = Buffer.alloc(256);
        header._write(buff);

        const header2 = ShpHeader._read(buff);
        expect(header2).toEqual(header);
    })
});