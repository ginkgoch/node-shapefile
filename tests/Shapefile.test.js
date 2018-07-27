const Shapefile = require('../libs/Shapefile');
const _ = require('lodash');

describe('shapefile test', () => {
    const citiesPath = './tests/data/USStates.shp';

    test('shapefile - general test', async () => {
        const shapefile = new Shapefile(citiesPath);
        await shapefile.openWith(async () => {
            const shapefileIt = await shapefile.readRecords();
            let record1 = await shapefileIt.next();
            let count = 0;
            while(!record1.done) {
                record1 = _.omit(record1, ['done']);
                const record2 = await shapefile.get(count);
                expect(record2).toHaveProperty('geom');
                expect(record2).toHaveProperty('fields');
                expect(record2).toEqual(record1);

                count++;
                record1 = await shapefileIt.next();
            }
            expect(count).toBe(51);
        });

    });
});