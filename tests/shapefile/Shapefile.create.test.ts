import fs from "fs";

import * as Utils from "../utils/Utils";
import DbfField from "../../src/dbf/DbfField";
import { ShapefileType } from "../../src/shared";
import Shapefile from "../../src/shapefile/Shapefile";
import { DbfFieldType } from "../../src/dbf/DbfFieldType";

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


            await shapefile.close();
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

function createFeature(point: number[], props: any) {

}