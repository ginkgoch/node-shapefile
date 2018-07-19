const path = require('path');
const Shapefile = require('../libs/Shapefile');
const citiesPath = path.join(__dirname, 'data/cities_e.shp');

describe('shapefile tests', () => {
    test('open close test 1', async () => {
        const citiesShp = new Shapefile(citiesPath);

        expect(citiesShp.isOpened).toBeFalsy();
        await citiesShp.open();
        expect(citiesShp.isOpened).toBeTruthy();
        expect(citiesShp._fd).not.toBeUndefined();

        await citiesShp.close();
        expect(citiesShp.isOpened).toBeFalsy();
        expect(citiesShp._fd).toBeUndefined();
    });

    test('open close test 2', async () => {
        const citiesShp = new Shapefile(citiesPath);

        expect(citiesShp.isOpened).toBeFalsy();
        await citiesShp.open();
        await citiesShp.open();
        expect(citiesShp.isOpened).toBeTruthy();
        expect(citiesShp._fd).not.toBeUndefined();

        await citiesShp.close();
        await citiesShp.close();
        expect(citiesShp.isOpened).toBeFalsy();
        expect(citiesShp._fd).toBeUndefined();
    });

    test('read header test 1', async () => {
        const citiesShp = new Shapefile(citiesPath);
        await citiesShp.open();
        const header = await citiesShp._readHeader();
        
        expect(header.fileCode).toBe(9994);
        expect(header.fileLength).toBe(533024);
        expect(header.version).toBe(1000);
        expect(header.fileType).toBe(1);
        expect(header.envelope.minx).toBeCloseTo(-174.1964, 4);
        expect(header.envelope.miny).toBeCloseTo(19.0972, 4);
        expect(header.envelope.maxx).toBeCloseTo(173.2376, 4);
        expect(header.envelope.maxy).toBeCloseTo(70.6355, 4);
    });

    test('read header test 2', async () => {
        try{ 
            const citiesShp = new Shapefile(citiesPath);
            await citiesShp._readHeader();
        }
        catch(err) {
            expect(err).toMatch(/Shapefile not opened/);
        }
    });

    test('read records test 1', async () => {
        const citiesShp = new Shapefile(citiesPath);
        await citiesShp.open();
        
        const records = await citiesShp._readRecords();
    });
});