const Shapefile = require('../libs/Shapefile');
const _ = require('lodash');

describe('cli-support-tests', () => {
    const statesPath = './tests/data/USStates.shp';
    test('get header - normal', async () => {
        const shapefile = new Shapefile(statesPath);
        await shapefile.openWith(async () => {
            const header = shapefile.header();
            expect(header).not.toBeNull();
            expect(header).not.toBeUndefined();
        });
    });

    test('get header - not exist', async () => {
        try {
            const shapefile = new Shapefile('un-exist-statesPath.shp');
            await shapefile.openWith(async () => { });
            throw 'open should not pass';
        }
        catch(err) {
            expect(err.toString()).toMatch(/not exists./);
        }
    });

    test('get fields - default', async () => {
        const shapefile = new Shapefile(statesPath);
        await shapefile.openWith(async () => {
            const fields = shapefile.fields();
            expect(fields).not.toBeNull();
            expect(fields).not.toBeUndefined();
            expect(fields.length).toBe(52);
        });
    });

    test('get fields - detail', async () => {
        const shapefile = new Shapefile(statesPath);
        await shapefile.openWith(async () => {
            const fields = shapefile.fields(true);
            expect(fields).not.toBeNull();
            expect(fields).not.toBeUndefined();
            expect(_.entries(fields).length).toBe(52);
            expect(_.keys(_.first(fields))).toEqual(['name', 'type', 'length', 'decimal']);
        });
    });
});

describe('shapefile test', () => {
    const citiesPath = './tests/data/USStates.shp';

    test('shapefile - envelope', async () => {
        const shapefile = new Shapefile(citiesPath);
        await shapefile.openWith(async () => {
            const envelope = shapefile.envelope();
            expect(envelope).not.toBeUndefined();
            expect(envelope).not.toBeNull();
        });
    });

    test('shapefile - get count', async () => {
        const shapefile = new Shapefile(citiesPath);
        await shapefile.openWith(async () => {
            expect(await shapefile.count()).toBe(51);
        });
    });

    test('shapefile - general test', async () => {
        const shapefile = new Shapefile(citiesPath);
        await shapefile.openWith(async () => {
            const shapefileIt = await shapefile.iterator();
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
            const shapefileIt = await shapefile.iterator({ fields: ['RECID'] });
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
            const shapefileIt = await shapefile.iterator({ fields: [] });
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

describe('shapefile filters', () => {
    const filePath = './tests/data/USStates.shp';

    test('shapefile - filter 1', async () => {
        const shapefile = new Shapefile(filePath);
        await shapefile.openWith(async () => {
            let iterator = await shapefile.iterator();
            // const filter = { minx: 0, miny: 0, maxx: 180, maxy: 90 };
            // iterator.filter = filter;

            // const disjoined = shapefile.envelope().disjoined(filter);
            // expect(disjoined).toBeTruthy();
        
            // let rec = undefined;
            // const action = jest.fn();
            // while((rec = await iterator.next()) && !rec.done) {
            // }

            // expect(action.mock.calls.length).toBe(0);
        });
    });
});