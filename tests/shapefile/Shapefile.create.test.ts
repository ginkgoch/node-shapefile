import fs from "fs";

import * as Utils from "../utils/Utils";
import DbfField from "../../src/dbf/DbfField";
import { ShapefileType } from "../../src/shared";
import Shapefile from "../../src/shapefile/Shapefile";
import { DbfFieldType } from "../../src/dbf/DbfFieldType";
import { Point, Feature, IFeature } from "ginkgoch-geom";

describe('Shapefile create', () => {
    it('createEmpty', () => {
        const filePath = './tests/data/shapefile_create_new.shp';
        createShapefileForEditing(filePath, (shapefile) => {
            ['.shp', '.shx', '.dbf'].forEach(ext => {
                const tmpPath = filePath.replace(/\.shp/, ext);
                expect(fs.existsSync(tmpPath)).toBeTruthy();
            });

            shapefile.open();
            expect(shapefile.shapeType()).toEqual(ShapefileType.point);
            expect(shapefile.fields().length).toBe(2);
            shapefile.close();
        });
    });

    it('push new feature', () => {
        const filePath = './tests/data/shapefile_create_new.shp';
        createShapefileForEditing(filePath, shapefile => {
            shapefile.open();

            let feature1 = createPointFeature([23, 34], { 'RECID': 1, 'NAME': 'Sam' }, 1);
            shapefile.push(feature1);

            let feature2 = createPointFeature([56.9, 312.45], { 'RECID': 2, 'NAME': 'Bill' }, 2);
            feature2.id = 2;
            shapefile.push(feature2);
            shapefile.close();

            shapefile.open();
            expect(shapefile.count()).toBe(2);

            const records = shapefile.records();
            expect(records.length).toBe(2);
            expect(records[0].geometry).toEqual(feature1.geometry);
            expect(records[0].properties).toEqual(feature1.properties);

            expect(records[1].geometry).toEqual(feature2.geometry);
            expect(records[1].properties).toEqual(feature2.properties);
        })
    });

    it('edit feature', () => {
        const filePath = './tests/data/shapefile_create_new.shp';
        createShapefileForEditing(filePath, shapefile => {
            shapefile.open();

            let feature1 = createPointFeature([23, 34], { 'RECID': 1, 'NAME': 'Sam' }, 1);
            shapefile.push(feature1);

            let feature2 = createPointFeature([56.9, 312.45], { 'RECID': 2, 'NAME': 'Bill' }, 2);
            shapefile.push(feature2);
            shapefile.close();

            shapefile.open();
            let feature2_new = createPointFeature([61.3, 256.63], { 'RECID': 2, 'NAME': 'Will' }, 2);
            shapefile.update(feature2_new);
            shapefile.close();


            shapefile.open();
            const feature1_ = shapefile.get(1);
            const feature2_ = shapefile.get(2);
            expect(feature1_).toEqual(feature1);
            expect(feature2_).toEqual(feature2_new);
            shapefile.close();

        })
    });

    it('delete feature', () => {
        const filePath = './tests/data/shapefile_create_new.shp';
        createShapefileForEditing(filePath, shapefile => {
            shapefile.open();

            let feature1 = createPointFeature([23, 34], { 'RECID': 1, 'NAME': 'Sam' }, 1);
            shapefile.push(feature1);

            let feature2 = createPointFeature([56.9, 312.45], { 'RECID': 2, 'NAME': 'Bill' }, 2);
            shapefile.push(feature2);
            shapefile.close();

            shapefile.open();
            
            shapefile.remove(2);
            const feature2_ = shapefile.get(2);
            expect(feature2_).toBeNull();

            shapefile.close();
        })
    });

});

function createShapefileForEditing(filePath: string, action: (f: Shapefile) => void) {
    try {
        const fields = new Array<DbfField>();
        fields.push(new DbfField('RECID', DbfFieldType.number));
        fields.push(new DbfField('NAME', DbfFieldType.character, 10));

        const shapefile = Shapefile.createEmpty(filePath, ShapefileType.point, fields);
        action(shapefile);
    } finally {
        Utils.clearShapefiles(filePath);
    }
}

function createPointFeature(coords: number[], props: any, id: number): IFeature {
    const point = new Point(coords[0], coords[1]);
    point.id = id;
    const properties = new Map<string, any>();
    Object.keys(props).forEach((v) => properties.set(v, props[v]));
    return new Feature(point, properties, id);
}