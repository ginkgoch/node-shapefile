import Shapefile from "../../src/shapefile/Shapefile";
import Optional from "../../src/base/Optional";
import IFeature from "../../src/shapefile/IFeature";

describe('demos tests', () => {
    async function loopUSStates(callback: (rec: Optional<IFeature>) => void) {
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

    async function getRecordById(id: number) {
        const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
        const record = await statesShp.get(0);
        await statesShp.close();

        return record;
    }

    test('demo 2 - get record by id - all fields', async () => {
        const record = await getRecordById(0);
        expect(record).not.toBeNull();
        expect(record).not.toBeUndefined();
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