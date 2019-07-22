import _ from "lodash";
import Envelope from "../../src/shp/Envelope";
import ShpWriter from "../../src/shp/ShpWriter";
import ShpReader from "../../src/shp/ShpReader";

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
        const parts1 = [4, 9, 1, 8, 2, 7];

        const buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        writer.writeParts(parts1);

        const reader = new ShpReader(buff);
        const parts2 = reader.nextParts(parts1.length);

        compareArray(parts1, parts2);
    });

    it('writePoints', () => {
        const points1 = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]];

        const buff = Buffer.alloc(256);
        const writer = new ShpWriter(buff);
        const parts = writer.writePoints(points1);

        const reader = new ShpReader(buff);
        const points2 = reader.nextPointsByParts(parts.count, parts.parts);

        const flatten1 = _.flattenDeep(points1) as any;
        const flatten2 = _.flattenDeep(points2) as any;
        expect(compareArray(flatten1, flatten2))
    });
});

function compareArray(arr1: number[], arr2: number[]) {
    expect(arr1.length).toBe(arr2.length);
    for (let i = 0; i < arr1.length; i++) {
        expect(arr1[i]).toBe(arr2[i]);
    }
}