import Shapefile from "../../src/shapefile/Shapefile";
import Optional from "../../src/base/Optional";
import { IFeature, Feature } from "ginkgoch-geom";

describe('demos tests', () => {
    async function loopUSStates(callback: (rec: Optional<Feature | null>) => void) {
        const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
        const iterator = await statesShp.iterator();
        let record = undefined;
        while ((record = await iterator.next()) && !iterator.done) {
            callback(record);
        }
        await statesShp.close();
    }

    test('demo 1 - load usstates', async () => {
        const mockup = jest.fn();
        await loopUSStates(mockup);
        expect(mockup.mock.calls.length).toBe(51);
    });

    async function getRecordById(id: number, fields?: string[]) {
        const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
        const record = await statesShp.get(id, fields);
        await statesShp.close();

        return record;
    }

    test('demo 2 - get record by id - all fields', async () => {
        const record = await getRecordById(1) as IFeature;
        expect(record).not.toBeNull();
        expect(record).not.toBeUndefined();
        expect(record.properties.size).not.toBe(0);
    });

    test('demo 2 - get record by id - none fields', async () => {
        const record = await getRecordById(1, []) as IFeature;
        expect(record).not.toBeNull();
        expect(record).not.toBeUndefined();
        expect(record.properties.size).toBe(0);
    });

    async function getAllRecords() {
        const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
        const record = await statesShp.records();
        await statesShp.close();

        return record;
    }

    test('demo 3 - get all record one time', async () => {
        const records = await getAllRecords();
        expect(records.length).toBe(51);
    });
});