import { FileReader } from "../../src/shared/FileReader";
import fs from 'fs';

describe('FileReader', () => {
    const filePath = './tests/data/file_reader_demo.dat';
    it('constructor - 1', () => {
        const fd = fs.openSync(filePath, 'rs');
        const stream = new FileReader(fd);

        expect(stream.fd).not.toBeNaN();
        expect(stream.cache.length).toBe(0);
    });

    it('constructor - 2', () => {
        const stream = new FileReader(filePath);

        expect(stream.fd).not.toBeNaN();
        expect(stream.cache.length).toBe(0);
        stream.close();
    });

    it('read - 1', () => {
        const stream = new FileReader(filePath);
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
        const stream = new FileReader(filePath);
        let content = '';
        let buff: Buffer;
        while ((buff = stream.read(20)).length > 0) {
            content += buff.toString();
        }

        expect(content).toEqual(fs.readFileSync(filePath).toString());
        stream.close();
    });
});