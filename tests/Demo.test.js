const Shapefile = require('../libs/Shapefile');

describe('demos tests', () => {
    async function loopUSStates(callback) {
        const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
        const iterator = await statesShp.iterator();
        let record = undefined;
        while ((record = await iterator.next()) && !record.done) {
            callback(record);
        }
        await statesShp.close();
    }
    
    test('demo 1 - load usstates', async () => {
        const mockup = jest.fn();
        await loopUSStates(mockup);
        expect(mockup.mock.calls.length).toBe(51);
    });

    async function getRecordById(id) {
        const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
        const record = await statesShp.get(0);
        await statesShp.close();

        return record;
    }

    test('demo 2 - get record by id - all fields', async () => {
        const record = await getRecordById(0);
        console.log(JSON.stringify(record));
        console.log(record);
    });
});