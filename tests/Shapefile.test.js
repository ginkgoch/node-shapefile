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

    test('shapefile - specific fields test', async () => {
        const shapefile = new Shapefile(citiesPath);
        await shapefile.openWith(async () => {
            const shapefileIt = await shapefile.readRecords(['RECID']);
            let record1 = await shapefileIt.next();
            let count = 0;
            while(!record1.done) {
                record1 = _.omit(record1, ['done']);
                const record2 = await shapefile.get(count, ['RECID']);
                expect(record2).toHaveProperty('geom');
                expect(record2).toHaveProperty('fields');
                expect(_.keys(record2.fields).length).toBe(1);
                expect(_.keys(record2.fields)[0]).toBe('RECID');
                expect(record2).toEqual(record1);

                count++;
                record1 = await shapefileIt.next();
            }
            expect(count).toBe(51);
        });
    });

    test('shapefile - specific fields test 1', async () => {
        const shapefile = new Shapefile(citiesPath);
        await shapefile.openWith(async () => {
            const shapefileIt = await shapefile.readRecords([]);
            let record1 = await shapefileIt.next();
            let count = 0;
            while(!record1.done) {
                record1 = _.omit(record1, ['done']);
                const record2 = await shapefile.get(count, []);
                expect(record2).toHaveProperty('geom');
                expect(record2).toHaveProperty('fields');
                expect(_.keys(record2.fields).length).toBe(0);
                expect(record2).toEqual(record1);

                count++;
                record1 = await shapefileIt.next();
            }
            expect(count).toBe(51);
        });
    });

    test('field names tests', async () => {
        const filePath = './tests/data/USStates.shp';
        const shapefile = new Shapefile(filePath);
        await shapefile.openWith(async () => {
            let fields = shapefile._normalizeFields();
            expect(fields.length).toBe(52);

            fields = shapefile._normalizeFields('none');
            expect(fields.length).toBe(0);

            fields = shapefile._normalizeFields('all');
            expect(fields.length).toBe(52);

            fields = shapefile._normalizeFields(['RECID', 'AREA', 'PERIMETER', 'STATE_', 'STATE_ID', 'STATE_NAME', 'STATE_FIPS', 'SUB_REGION']);
            expect(fields.length).toBe(8);

            fields = shapefile._normalizeFields(['RECID1', 'AREA', 'PERIMETER', 'STATE_', 'STATE_ID', 'STATE_NAME', 'STATE_FIPS', 'SUB_REGION']);
            expect(fields.length).toBe(7);
        });
    });
});