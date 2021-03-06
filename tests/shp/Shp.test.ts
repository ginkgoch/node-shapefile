/// <reference path="../jest/JestEx.d.ts" />

import _ from 'lodash';
import '../jest/JestEx';
import Shp from "../../src/shp/Shp";
import { Envelope, GeometryType, Polygon, Point, LineString, Geometry, MultiPolygon } from 'ginkgoch-geom';
import Shapefile from '../../src/shapefile/Shapefile';

const citiesPath = './tests/data/cities_e.shp';

describe('shapefile general tests', () => {
    test('open close test 1', () => {
        const citiesShp = new Shp(citiesPath);

        expect(citiesShp.isOpened).toBeFalsy();
        citiesShp.open();
        expect(citiesShp.isOpened).toBeTruthy();
        expect(citiesShp._fd).not.toBeUndefined();

        citiesShp.close();
        expect(citiesShp.isOpened).toBeFalsy();
        expect(citiesShp._fd).toBeUndefined();
    });

    test('open close test 2', () => {
        const citiesShp = new Shp(citiesPath);

        expect(citiesShp.isOpened).toBeFalsy();
        citiesShp.open();
        citiesShp.open();
        expect(citiesShp.isOpened).toBeTruthy();
        expect(citiesShp._fd).not.toBeUndefined();

        citiesShp.close();
        citiesShp.close();
        expect(citiesShp.isOpened).toBeFalsy();
        expect(citiesShp._fd).toBeUndefined();
    });

    test('read header test 1', () => {
        const citiesShp = new Shp(citiesPath);

        try {
            citiesShp.open();
            const header = citiesShp._readHeader();

            expect(header.fileCode).toBe(9994);
            expect(header.fileLength).toBe(533024);
            expect(header.version).toBe(1000);
            expect(header.fileType).toBe(1);
            expect(header.envelope.minx).toBeCloseTo(-174.1964, 4);
            expect(header.envelope.miny).toBeCloseTo(19.0972, 4);
            expect(header.envelope.maxx).toBeCloseTo(173.2376, 4);
            expect(header.envelope.maxy).toBeCloseTo(70.6355, 4);
        } finally {
            citiesShp.close();
        }
    });

    test('read header test 2', () => {
        try {
            const citiesShp = new Shp(citiesPath);
            citiesShp._readHeader();
        } catch (err) {
            expect(err).toMatch(/Shapefile not opened/);
        }
    });
});

describe('shapefile test - polyline', () => {
    const lineShpPath = './tests/data/Austinstreets.shp';

    test('read records test - polyline loop', () => {
        const callbackMock = jest.fn();
        loopRecords(lineShpPath, callbackMock);
        expect(callbackMock.mock.calls.length).toBe(13843);
    });

    test('read records test - polyline read first record', () => {
        const lineShp = new Shp(lineShpPath);
        lineShp.open();

        const records = lineShp.iterator();
        let record = records.next();

        expect(record.value).not.toBeNullOrUndefined();
        expect(record.value).toBeGeneralRecord(1);

        const line = record.value as LineString;
        const coordinates = new Array<Number[]>();
        line.coordinatesFlat().forEach(c => {
            coordinates.push([c.x, c.y]);
        });
        expect({ coordinates }).toBeClosePolyLineTo([-97.731192, 30.349088, -97.731584, 30.349305], 4);

        lineShp.close();
    });
});

describe('shapefile test - point', () => {
    test('read records test - point loop', () => {
        const callbackMock = jest.fn();
        loopRecords(citiesPath, callbackMock);
        expect(callbackMock.mock.calls.length).toBe(19033);
    });

    test('read records test - point read first record', () => {
        const record = getFirstRecord(citiesPath) as Geometry;
        expect(record).toBeGeneralRecord(1);

        const coordinates = record.coordinates();
        expect(coordinates).toBeClosePointTo([-122.2065, 48.7168], 4);
    });
});

describe('shapefile test - polygon', () => {
    const shpPath = './tests/data/USStates.shp';

    test('read records test - polygon loop', () => {
        const callbackMock = jest.fn();
        loopRecords(shpPath, callbackMock);
        expect(callbackMock.mock.calls.length).toBe(51);
    });

    test('read records test - polygon read first record', () => {
        let recordOpt = getFirstRecord(shpPath);
        expect(recordOpt).toBeGeneralRecord(1);

        const record = recordOpt as MultiPolygon;
        expect(record.type).toEqual(GeometryType.MultiPolygon);
        expect(record.coordinates().length).toBe(3);
        expect(record.coordinates()[0][0].length).toBe(244);
        expect(record.coordinates()[1][0].length).toBe(12);
        expect(record.coordinates()[2][0].length).toBe(20);
        expect(record.coordinates()[0][0][0]).toEqual(record.coordinates()[0][0][243]);
        expect(record.coordinates()[1][0][0]).toEqual(record.coordinates()[1][0][11]);
        expect(record.coordinates()[2][0][0]).toEqual(record.coordinates()[2][0][19]);
    });
});

describe('read by id tests', () => {
    test('read single test', () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        shp.openWith(() => {
            const recordIterator = shp.iterator();

            let index = 1, ri = undefined;
            while ((ri = recordIterator.next()) && !recordIterator.done) {
                ri = ri.value;
                const r = shp.get(index);
                expect(r).toEqual(ri);
                index++;
            }
        });
    });
});

function loopRecords(path: string, callback: () => void) {
    const shapefile = new Shp(path);
    shapefile.open();
    const records = shapefile.iterator();

    let record;
    while ((record = records.next()) && !records.done) {
        callback();
    }
    shapefile.close();
}

function getFirstRecord(path: string): Geometry | null {
    const shapefile = new Shp(path);
    shapefile.open();

    const records = shapefile.iterator();
    const record = records.next();
    shapefile.close();

    return record.value;
}

describe('Read shp records tests', () => {
    test('read shp records - all', () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        shp.openWith(() => {
            const features = shp.records();
            expect(features.length).toBe(51);

            const recordIterator = shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = recordIterator.next()) && !recordIterator.done) {
                const r = features[index];
                expect(r.id).toBe(index + 1);
                expect(r).toEqual(ri.value);
                index++;
            }
        });

    });

    test('read shp records - from', () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        shp.openWith(() => {
            const features = shp.records({ from: 20 });
            expect(features.length).toBe(32);

            const recordIterator = shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = recordIterator.next()) && !recordIterator.done) {
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

    test('read shp records - limit', () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        shp.openWith(() => {
            const features = shp.records({ limit: 20 });
            expect(features.length).toBe(20);

            const recordIterator = shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = recordIterator.next()) && !recordIterator.done) {
                ri = ri.value;

                if (index < 20) {
                    const r = features[index];
                    expect(r).toEqual(ri);
                    index++;
                }
            }
        });
    });

    test('read shp records - from + limit', () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        shp.openWith(() => {
            const features = shp.records({ from: 10, limit: 20 });
            expect(features.length).toBe(20);

            const recordIterator = shp.iterator();

            let index = 0, ri = undefined;
            while ((ri = recordIterator.next()) && !recordIterator.done) {
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

    test('read shp records - envelope', () => {
        const shpPath = './tests/data/USStates.shp';
        const shp = new Shp(shpPath);
        shp.openWith(() => {
            const features = shp.records({ envelope: new Envelope(-1, -1, 1, 1) });
            expect(features.length).toBe(0);
        });
    });

    const fs = require('fs');
    const path = require('path');
    test('delete shp record', () => {
        const shpPathSrc = './tests/data/USStates.shp';
        const shpPath = './tests/data/USStates_delete_test.shp';
        Shapefile.copyFiles(shpPathSrc, shpPath, true);

        const shp = new Shp(shpPath, 'rs+');
        shp.openWith(() => {
            const id = 30;

            try {
                shp.remove(id);
                const record = shp.get(id);
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

    test('_matchFilter', () => {
        expect(undefined).toBeFalsy();
        expect(_.isUndefined(undefined) === true).toBeTruthy();

        const filter = {};
        const envelope = { minx: -40, miny: -40, maxx: 40, maxy: 40 };

        let match = Shp._matchFilter(filter, envelope);
        expect(match).toBeTruthy();

        match = Shp._matchFilter(null, envelope);
        expect(match).toBeTruthy();

        match = Shp._matchFilter(undefined, envelope);
        expect(match).toBeTruthy();

        match = Shp._matchFilter({ envelope: { minx: -40, miny: -40, maxx: 40, maxy: 40 } }, envelope);
        expect(match).toBeTruthy();
    });
});