import { FileStream } from "../../src/shared/FileStream";
import fs from 'fs';

describe('FileReader', () => {
    const filePath = './tests/data/file_reader_demo.dat';
    it('constructor - 1', () => {
        const fd = fs.openSync(filePath, 'rs');
        const stream = new FileStream(fd);

        expect(stream.fd).not.toBeNaN();
        expect(stream.cache.length).toBe(0);
    });

    it('constructor - 2', () => {
        const stream = new FileStream(filePath);

        expect(stream.fd).not.toBeNaN();
        expect(stream.cache.length).toBe(0);
        stream.close();
    });

    it('seek', () => {
        const stream = new FileStream(filePath);
        stream.seek(30);
        expect(stream.position).toBe(30);

        stream.seek(10, 'current');
        expect(stream.position).toBe(40);

        stream.seek(10, 'end');
        expect(stream.position).toBe(856);
    });

    it('read - 1', () => {
        const stream = new FileStream(filePath);
        let buff = stream.read(20);
        expect(buff.length).toBe(20);
        expect(buff.toString()).toEqual('Hello World.Hello Wo');

        buff = stream.read(20);
        expect(buff.length).toBe(20);
        expect(buff.toString()).toEqual('rld.Hello World.Hell');

        buff = stream.read(20);
        expect(buff.length).toBe(20);
        expect(buff.toString()).toEqual('o World.Hello World.');
        stream.close();
    });

    it('read all', () => {
        const stream = new FileStream(filePath);
        let content = '';
        let buff: Buffer;
        while ((buff = stream.read(20)).length > 0) {
            content += buff.toString();
        }

        expect(content).toEqual(fs.readFileSync(filePath).toString());
        stream.close();
    });
});