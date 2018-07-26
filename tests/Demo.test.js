const Shapefile = require('../libs/Shapefile');

describe('demos tests', () => {
    async function loopUSStates(callback) {
        const citiesShp = new Shapefile('./tests/data/USStates.shp');
        await citiesShp.open();
    
        const records = await citiesShp.readRecords();
        let record = undefined;
        while ((record = await records.next()) && !record.done) {
            callback(record);
        }
    }
    
    test('demo 1 - load usstates', async () => {
        const mockup = jest.fn();
        await loopUSStates(mockup);
        expect(mockup.mock.calls.length).toBe(51);
    });
});