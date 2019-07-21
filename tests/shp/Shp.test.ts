import _ from 'lodash';
import Shp from "../../src/shp/Shp";
import '../jest/JestEx';
import { ShapefileType } from '../../src/shared';
import Envelope from '../../src/shp/Envelope';

const citiesPath = './tests/data/cities_e.shp';

describe('shapefile general tests', () => {
    test('get stream option test', async () => {
        const citiesShp = new Shp(citiesPath);

        expect(citiesShp).not.toBeNullOrUndefined();

        await citiesShp.open();
        let opt1 = citiesShp._getStreamOption(100);
        expect(_.keys(opt1).length).toBe(2);
        expect(opt1.autoClose).toBeTruthy();
        expect(opt1.start).toBe(100);

        opt1 = citiesShp._getStreamOption(100, 108);
        expect(_.keys(opt1).length).toBe(3);
        expect(opt1.autoClose).toBeTruthy();
        expect(opt1.start).toBe(100);
        expect(opt1.end).toBe(108);
        await citiesShp.close();
    });

    test('open close test 1', async () => {
        const citiesShp = new Shp(citiesPath);

        expect(citiesShp.isOpened).toBeFalsy();
        await citiesShp.open();
        expect(citiesShp.isOpened).toBeTruthy();
        expect(citiesShp._fd).not.toBeUndefined();

        await citiesShp.close();
        expect(citiesShp.isOpened).toBeFalsy();
        expect(citiesShp._fd).toBeUndefined();
    });

    test('open close test 2', async () => {
        const citiesShp = new Shp(citiesPath);

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
        const citiesShp = new Shp(citiesPath);

        try {
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
        } finally {
            await citiesShp.close();
        }
    });

    test('read header test 2', async () => {
        try {
            const citiesShp = new Shp(citiesPath);
            await citiesShp._readHeader();
        } catch (err) {
            expect(err).toMatch(/Shapefile not opened/);
        }
    });
});

describe('shapefile test - polyline', () => {
    const lineShpPath = './tests/data/Austinstreets.shp';

    test('read records test - polygline loop', async () => {
        const callbackMock = jest.fn();
        await loopRecords(lineShpPath, callbackMock);
        expect(callbackMock.mock.calls.length).toBe(13843);
    });

    test('read records test - polyline read first record', async () => {
        const lineShp = new Shp(lineShpPath);
        await lineShp.open();

        const records = await lineShp.iterator();
        let record = await records.next();

        expect(record).not.toBeNullOrUndefined();
        expect(record).toBeGeneralRecord(1);
        expect(record.value.geometry).toBeClosePolyLineTo([-97.731192, 30.349088, -97.731584, 30.349305], 4);

        await lineShp.close();
    });
});

describe('shapefile test - point', () => {
    test('read records test - point loop', async () => {
        const callbackMock = jest.fn();
        await loopRecords(citiesPath, callbackMock);
        expect(callbackMock.mock.calls.length).toBe(19033);
    });

    test('read records test - point read first record', async () => {
        const record = await getFirstRecord(citiesPath);
        expect(record).toBeGeneralRecord(1);
        expect(record.value.geometry).toBeClosePointTo([-122.2065, 48.7168], 4);
    });
});

describe('shapefile test - polygon', () => {
    const shpPath = './tests/data/USStates.shp';

    test('read records test - polygon loop', async () => {
        const callbackMock = jest.fn();
        await loopRecords(shpPath, callbackMock);
        expect(callbackMock.mock.calls.length).toBe(51);
    });

    test('read records test - polygon read first record', async () => {
        let recordOpt = await getFirstRecord(shpPath);
        expect(recordOpt).toBeGeneralRecord(1);

        const record = recordOpt.value;
        expect(record.geometry.type).toEqual(ShapefileType.polygon);
        expect(record.geometry.coordinates.length).toBe(3);
        expect(record.geometry.coordinates[0].length).toBe(244);
        expect(record.geometry.coordinates[1].length).toBe(12);
        expect(record.geometry.coordinates[2].length).toBe(20);
        expect(record.geometry.coordinates[0][0]).toEqual(record.geometry.coordinates[0][243]);
        expect(record.geometry.coordinates[1][0]).toEqual(record.geometry.coordinates[1][11]);
        expect(record.geometry.coordinates[2][0]).toEqual(record.geometry.coordinates[2][19]);
    });
});

describe('read by id tests', () => {
    test('read single test', async () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        await shp.openWith(async () => {
            const recordIterator = await shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = await recordIterator.next()) && !recordIterator.done) {
                ri = ri.value;
                const r = await shp.get(index);
                expect(r).toEqual(ri);
                index++;
            }
        });
    });
});

async function loopRecords(path: string, callback: () => void) {
    const shapefile = new Shp(path);
    await shapefile.open();
    const records = await shapefile.iterator();

    let record;
    while ((record = await records.next()) && !records.done) {
        callback();
    }
    await shapefile.close();
}

async function getFirstRecord(path: string) {
    const shapefile = new Shp(path);
    await shapefile.open();

    const records = await shapefile.iterator();
    const record = await records.next();
    await shapefile.close();

    return await Promise.resolve(record);
}

describe('Read shp records tests', () => {
    test('read shp records - all', async () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        await shp.openWith(async () => {
            const features = await shp.records();
            expect(features.length).toBe(51);

            const recordIterator = await shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = await recordIterator.next()) && !recordIterator.done) {
                const r = features[index];
                expect(r.id).toBe(index + 1);
                expect(r).toEqual(ri.value);
                index++;
            }
        });

    });

    test('read shp records - from', async () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        await shp.openWith(async () => {
            const features = await shp.records({ from: 20 });
            expect(features.length).toBe(31);

            const recordIterator = await shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = await recordIterator.next()) && !recordIterator.done) {
                ri = ri.value;

                if (index >= 20) {
                    const r = features[index - 20];
                    expect(r.id).toEqual(index + 1);
                    expect(r).toEqual(ri);
                    index++;
                }
            }
        });
    });

    test('read shp records - limit', async () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        await shp.openWith(async () => {
            const features = await shp.records({ limit: 20 });
            expect(features.length).toBe(20);

            const recordIterator = await shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = await recordIterator.next()) && !recordIterator.done) {
                ri = ri.value;

                if (index < 20) {
                    const r = features[index];
                    expect(r).toEqual(ri);
                    index++;
                }
            }
        });
    });

    test('read shp records - from + limit', async () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        await shp.openWith(async () => {
            const features = await shp.records({ from: 10, limit: 20 });
            expect(features.length).toBe(20);

            const recordIterator = await shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = await recordIterator.next()) && !recordIterator.done) {
                ri = ri.value;

                if (index >= 10 && index < 30) {
                    const r = features[index - 10];
                    expect(r.id).toEqual(index + 1);
                    expect(r).toEqual(ri);
                    index++;
                }
            }
        });
    });

    test('read shp records - envelope', async () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        await shp.openWith(async () => {
            const features = await shp.records({ envelope: new Envelope(-1, -1, 1, 1) });
            expect(features.length).toBe(0);
        });
    });

    const fs = require('fs');
    const path = require('path');
    test('delete shp record', async () => {
        const shpPathSrc = './tests/data/USStates.shp';
        const shpPath = './tests/data/USStates_delete_test.shp';
        Shp.copyFiles(shpPathSrc, shpPath, true);

        const shp = new Shp(shpPath, 'rs+');
        await shp.openWith(async () => {
            const id = 30;

            try {
                shp.removeAt(id);
                const record = await shp.get(id);
                expect(record).toBeNull();
            } finally {
                ['.shp', '.shx', '.dbf'].forEach(ext => {
                    const temp = shpPath.replace(/\.shp/g, ext);
                    if (fs.existsSync(temp)) {
                        fs.unlinkSync(temp);
                    }
                });
            }
        });
    });
});