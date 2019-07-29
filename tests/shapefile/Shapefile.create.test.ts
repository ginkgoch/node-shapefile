import fs from "fs";

import * as Utils from "../utils/Utils";
import DbfField from "../../src/dbf/DbfField";
import { ShapefileType } from "../../src/shared";
import Shapefile from "../../src/shapefile/Shapefile";
import { DbfFieldType } from "../../src/dbf/DbfFieldType";
import { Point, Feature, IFeature } from "ginkgoch-geom";

describe('Shapefile create', () => {
    it('createEmpty', async () => {
        const filePath = './tests/data/shapefile_create_new.shp';
        await createShapefileForEditing(filePath, async (shapefile) => {
            ['.shp', '.shx', '.dbf'].forEach(ext => {
                const tmpPath = filePath.replace(/\.shp/, ext);
                expect(fs.existsSync(tmpPath)).toBeTruthy();
            });

            await shapefile.open();
            expect(shapefile.shapeType()).toEqual(ShapefileType.point);
            expect(shapefile.fields().length).toBe(2);
            await shapefile.close();
        });
    });

    it('push new feature', async () => {
        const filePath = './tests/data/shapefile_create_new.shp';
        await createShapefileForEditing(filePath, async (shapefile) => {
            await shapefile.open();

            let feature1 = createPointFeature([23, 34], { 'RECID': 1, 'NAME': 'Sam' });
            shapefile.push(feature1);

            let feature2 = createPointFeature([56.9, 312.45], { 'RECID': 2, 'NAME': 'Bill' });
            shapefile.push(feature2);
            await shapefile.close();

            await shapefile.open();
            expect(shapefile.count()).toBe(2);

            const records = await shapefile.records();
            expect(records.length).toBe(2);
            expect(records[0].geometry).toEqual(feature1.geometry);
            expect(records[0].properties).toEqual(feature1.properties);

            expect(records[1].geometry).toEqual(feature2.geometry);
            expect(records[1].properties).toEqual(feature2.properties);
        })
    });
});

async function createShapefileForEditing(filePath: string, action: (f: Shapefile) => Promise<void>) {
    try {
        const fields = new Array<DbfField>();
        fields.push(new DbfField('RECID', DbfFieldType.number));
        fields.push(new DbfField('NAME', DbfFieldType.character, 10));

        const shapefile = Shapefile.createEmpty(filePath, ShapefileType.point, fields);
        await action(shapefile);
    } finally {
        Utils.clearShapefiles(filePath);
    }
}

function createPointFeature(coords: number[], props: any): IFeature {
    const point = new Point(coords[0], coords[1]);
    const properties = new Map<string, any>();
    Object.keys(props).forEach((v) => properties.set(v, props[v]));
    return new Feature(point, properties);
}