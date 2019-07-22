import ShpWriter from "../../src/shp/ShpWriter";
import ShpReader from "../../src/shp/ShpReader";
import Envelope from "../../src/shp/Envelope";

describe('ShpWriter', () => {
    it('writeEnvelope', () => {
        const envelope1 = { minx: 34, miny: 45, maxx: 56, maxy: 67 };

        const buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        writer.writeEnvelope(envelope1);

        const reader = new ShpReader(buff);
        const envelope2 = reader.nextEnvelope();

        const same = Envelope.equals(envelope1, envelope2)
        expect(same).toBeTruthy();
    });

    it('writePoint', () => {
        const point1 = [34.5, 45.6];

        const buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        writer.writePoint(point1);

        const reader = new ShpReader(buff);
        const point2 = reader.nextPoint();

        compareArray(point1, point2);
    });

    it('writeParts', () => {
        const parts1 = [4, 9, 1, 8, 2,  7];

        const buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        writer.writeParts(parts1);

        const reader = new ShpReader(buff);
        const parts2 = reader.nextParts(parts1.length);

        compareArray(parts1, parts2);
    });
});

function compareArray(arr1: number[], arr2: number[]) {
    expect(arr1.length).toBe(arr2.length);
    for (let i = 0; i < arr1.length; i++) {
        expect(arr1[i]).toBe(arr2[i]);
    }
}