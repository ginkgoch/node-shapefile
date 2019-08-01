import { Feature } from "ginkgoch-geom";
import Shapefile from "../../src/shapefile/Shapefile";

describe('ShapefileIterator', () => {
    const filePath = './tests/data/USStates.shp';

    it('iterator - 1', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.open();

        const iterator = shapefile.iterator();
        const records = new Array<Feature>();
        while (!iterator.done) {
            const record = iterator.next();
            if (record.hasValue && record.value !== null) {
                records.push(record.value)
            }
        }

        expect(records.length).toBe(51);
        expect(records[0].properties.size).not.toBe(0);
        for (let i = 0; i < records.length; i++) {
            expect(records[i].id).toBe(i + 1);
        }

        shapefile.close();
    });

    it('iterator - 2', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.open();

        const iterator = shapefile.iterator({ from: 2 });
        const records = new Array<Feature>();
        while (!iterator.done) {
            const record = iterator.next();
            if (record.hasValue && record.value !== null) {
                records.push(record.value)
            }
        }

        expect(records.length).toBe(50);
        expect(records[0].properties.size).not.toBe(0);
        for (let i = 2; i <= records.length; i++) {
            expect(records[i - 2].id).toBe(i);
        }

        shapefile.close();
    });

    it('iterator - 3', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.open();

        const iterator = shapefile.iterator({ from: 2, limit: 4 });
        const records = new Array<Feature>();
        while (!iterator.done) {
            const record = iterator.next();
            if (record.hasValue && record.value !== null) {
                records.push(record.value)
            }
        }

        expect(records.length).toBe(4);
        expect(records[0].properties.size).not.toBe(0);
        for (let i = 0; i < records.length; i++) {
            expect(records[i].id).toBe(i + 2);
        }

        shapefile.close();
    });

    it('iterator - 4', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.open();

        const iterator = shapefile.iterator({ envelope: { minx: 0, maxx: 180, miny: -90, maxy: 90 } });
        const records = new Array<Feature>();
        while (!iterator.done) {
            const record = iterator.next();
            if (record.hasValue && record.value !== null) {
                records.push(record.value)
            }
        }

        expect(records.length).toBe(0);
        shapefile.close();
    });

    it('iterator - 5', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.open();

        const iterator = shapefile.iterator({ fields: ['RECID'] });
        const records = new Array<Feature>();
        while (!iterator.done) {
            const record = iterator.next();
            if (record.hasValue && record.value !== null) {
                records.push(record.value)
            }
        }

        expect(records.length).toBe(51);
        expect(records[0].properties.size).toBe(1);
        expect(records[0].properties.has('RECID'));

        for (let record of records) {
            expect(record.properties.get('RECID')).toBe(record.id);
        }

        shapefile.close();
    });
});