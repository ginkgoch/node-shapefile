import Shapefile from "../../src/shapefile/Shapefile";
import Optional from "../../src/base/Optional";
import { IFeature, Feature } from "ginkgoch-geom";

describe('demos tests', () => {
    function loopUSStates(callback: (rec: Optional<Feature | null>) => void) {
        const statesShp = new Shapefile('./tests/data/USStates.shp').open();
        const iterator = statesShp.iterator();
        let record = undefined;
        while ((record = iterator.next()) && !iterator.done) {
            callback(record);
        }
        statesShp.close();
    }

    test('demo 1 - load usstates', () => {
        const mockup = jest.fn();
        loopUSStates(mockup);
        expect(mockup.mock.calls.length).toBe(51);
    });

    function getRecordById(id: number, fields?: string[]) {
        const statesShp = new Shapefile('./tests/data/USStates.shp').open();
        const record = statesShp.get(id, fields);
        statesShp.close();

        return record;
    }

    test('demo 2 - get record by id - all fields', () => {
        const record = getRecordById(1) as IFeature;
        expect(record).not.toBeNull();
        expect(record).not.toBeUndefined();
        expect(record.properties.size).not.toBe(0);
    });

    test('demo 2 - get record by id - none fields', () => {
        const record = getRecordById(1, []) as IFeature;
        expect(record).not.toBeNull();
        expect(record).not.toBeUndefined();
        expect(record.properties.size).toBe(0);
    });

    function getAllRecords() {
        const statesShp = new Shapefile('./tests/data/USStates.shp').open();
        const record = statesShp.records();
        statesShp.close();

        return record;
    }

    test('demo 3 - get all record one time', () => {
        const records = getAllRecords();
        expect(records.length).toBe(51);
    });
});