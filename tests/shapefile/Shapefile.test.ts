import _ from "lodash";
import { EventEmitter } from "events";
import { Envelope, IFeature } from 'ginkgoch-geom';

import DbfField from "../../src/dbf/DbfField";
import Shapefile from "../../src/shapefile/Shapefile";

describe('cli-support-tests', () => {
    const statesPath = './tests/data/USStates.shp';
    test('get header - normal', () => {
        const shapefile = new Shapefile(statesPath);
        shapefile.openWith(() => {
            const header = shapefile.header();
            expect(header).not.toBeNull();
            expect(header).not.toBeUndefined();
        });
    });

    test('get header - not exist', () => {
        try {
            const shapefile = new Shapefile('un-exist-statesPath.shp');
            shapefile.openWith(() => { });
            throw 'open should not pass';
        }
        catch(err) {
            expect(err.toString()).toMatch(/not exists./);
        }
    });

    test('get fields - default', () => {
        const shapefile = new Shapefile(statesPath);
        shapefile.openWith(() => {
            const fields = shapefile.fields();
            expect(fields).not.toBeNull();
            expect(fields).not.toBeUndefined();
            expect(fields.length).toBe(52);
        });
    });

    test('get fields - detail', () => {
        const shapefile = new Shapefile(statesPath);
        shapefile.openWith(() => {
            const fields = <DbfField[]>shapefile.fields(true);
            expect(fields).not.toBeNull();
            expect(fields).not.toBeUndefined();
            expect(_.entries(fields).length).toBe(52);
            expect(_.keys(_.first(fields))).toEqual(['name', 'type', 'length', 'decimal']);
        });
    });
});

describe('shapefile test', () => {
    const citiesPath = './tests/data/USStates.shp';

    test('shapefile - envelope', () => {
        const shapefile = new Shapefile(citiesPath);
        shapefile.openWith(() => {
            const envelope = shapefile.envelope();
            expect(envelope).not.toBeUndefined();
            expect(envelope).not.toBeNull();
        });
    });

    test('shapefile - get count', () => {
        const shapefile = new Shapefile(citiesPath);
        shapefile.openWith(() => {
            expect(shapefile.count()).toBe(51);
        });
    });

    test('shapefile - general test', () => {
        const shapefile = new Shapefile(citiesPath);
        shapefile.openWith(() => {
            const iterator = shapefile.iterator();
            let record1 = iterator.next();
            let count = 0;
            while(!iterator.done) {
                const record2 = shapefile.get(count + 1);
                expect(record2).toHaveProperty('geometry');
                expect(record2).toHaveProperty('properties');
                expect(record2).toEqual(record1.value);

                count++;
                record1 = iterator.next();
            }

            expect(count).toBe(51);
        });
    });

    test('shapefile - specific fields test', () => {
        const shapefile = new Shapefile(citiesPath);
        shapefile.openWith(() => {
            const iterator = shapefile.iterator({ fields: ['RECID'] });
            let record1 = iterator.next();
            let count = 0;
            while(!iterator.done) {
                const record2 = shapefile.get(count + 1, ['RECID']) as IFeature;
                expect(record2).toHaveProperty('geometry');
                expect(record2).toHaveProperty('properties');
                expect(record2.properties.size).toBe(1);
                expect(record2.properties.has('RECID')).toBeTruthy();
                expect(record2).toEqual(record1.value);

                count++;
                record1 = iterator.next();
            }

            expect(count).toBe(51);
        });
    });

    test('shapefile - specific fields test 1', () => {
        const shapefile = new Shapefile(citiesPath);
        shapefile.openWith(() => {
            const iterator = shapefile.iterator({ fields: [] });
            let record1 = iterator.next();
            let count = 0;
            while(!iterator.done) {
                const record2 = shapefile.get(count + 1, []) as IFeature;
                expect(record2).toHaveProperty('geometry');
                expect(record2).toHaveProperty('properties');
                expect(record2.properties.size).toBe(0);
                expect(record2).toEqual(record1.value);

                count++;
                record1 = iterator.next();
            }
            expect(count).toBe(51);
        });
    });

    test('field names tests', () => {
        const filePath = './tests/data/USStates.shp';
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
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

    test('shapefile - filter 1', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
            const filter = { minx: 0, miny: 0, maxx: 180, maxy: 90 };
            let iterator = shapefile.iterator({ envelope: filter });

            const disjoined = Envelope.disjoined(shapefile.envelope(), filter);
            expect(disjoined).toBeTruthy();
        
            let rec = undefined;
            const actionForGeom = jest.fn();
            const actionForGeomNull = jest.fn();
            while((rec = iterator.next()) && !iterator.done) {
                if(rec.value !== null) {
                    actionForGeom();
                } else {
                    actionForGeomNull();
                }
            }

            expect(actionForGeom.mock.calls.length).toBe(0);
            expect(actionForGeomNull.mock.calls.length).toBe(0);
        });
    });

    test('shapefile - filter 2', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
            const filter = { minx: -178, miny: 0, maxx: -122, maxy: 90 };
            let iterator = shapefile.iterator({ envelope: filter });

            let rec = undefined;
            const actionForGeom = jest.fn();
            const actionForAll = jest.fn();
            while((rec = iterator.next()) && !iterator.done) {
                actionForAll();
                if(rec.value !== null) {
                    actionForGeom();
                }
            }

            expect(actionForGeom.mock.calls.length).toBe(5);
            expect(actionForAll.mock.calls.length).toBe(5);
        });
    });

    test('shapefile - filter 3', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
            let iterator = shapefile.iterator();

            let rec = undefined;
            const actionForGeom = jest.fn();
            const actionForAll = jest.fn();
            while((rec = iterator.next()) && !iterator.done) {
                actionForAll();
                if(rec.value !== null) {
                    actionForGeom();
                }
            }

            expect(actionForGeom.mock.calls.length).toBe(51);
            expect(actionForAll.mock.calls.length).toBe(51);
        });
    });

    it('records - no fields', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
            const records = shapefile.records({ fields: [] });
            expect(records.length).toBe(51);
            expect(records[0].properties.size).toBe(0);
        });
    });

    it('records - one fields', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
            const records = shapefile.records({ fields: ['RECID'] });
            expect(records.length).toBe(51);
            expect(records[0].properties.size).toBe(1);
            for(let rec of records) {
                expect(rec.id).toEqual(rec.properties.get('RECID'));
            }
        });
    });
});

describe('shapefile read records tests', () => {
    const filePath = './tests/data/USStates.shp';
    test('shapefile read records - read all', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
            const records = shapefile.records();
            expect(records.length).toBe(51);

            let iterator = shapefile.iterator();
            let index = 0, rec;
            while((rec = iterator.next()) && !iterator.done) {
                expect(records[index]).toEqual(rec.value);
                index++;
            }
        });
    });

    test('shapefile read records - progress', () => {
        const shapefile = new Shapefile(filePath);
        shapefile.openWith(() => {
            const progressChanged = jest.fn();
            const eventEmitter = new EventEmitter();
            shapefile.eventEmitter = eventEmitter;
            shapefile.eventEmitter.on('progress', progressChanged); 
            shapefile.records();
            shapefile.eventEmitter.removeAllListeners();
            shapefile.eventEmitter = undefined;

            expect(progressChanged.mock.calls.length).toBe(51);
            expect(progressChanged.mock.calls[0][0]).toBe(1);
            expect(progressChanged.mock.calls[0][1]).toBe(51);
            expect(progressChanged.mock.calls[50][0]).toBe(51);
            expect(progressChanged.mock.calls[50][1]).toBe(51);
        });
    });
});