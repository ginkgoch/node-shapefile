import fs from "fs";

import * as Utils from "../utils/Utils";
import DbfField from "../../src/dbf/DbfField";
import { ShapefileType } from "../../src/shared";
import Shapefile from "../../src/shapefile/Shapefile";
import { DbfFieldType } from "../../src/dbf/DbfFieldType";

describe('Shapefile create', () => {
    it('createEmpty', async () => {
        const filePath = './tests/data/shapefile_create_new.shp';

        try {
            const fields = new Array<DbfField>();
            fields.push(new DbfField('RECID', DbfFieldType.number));
            fields.push(new DbfField('NAME', DbfFieldType.character, 10));

            const shapefile = Shapefile.createEmpty(filePath, ShapefileType.point, fields);
            ['.shp', '.shx', '.dbf'].forEach(ext => {
                const tmpPath = filePath.replace(/\.shp/, ext);
                fs.existsSync(tmpPath);
            });

            await shapefile.open();
            expect(shapefile.shapeType()).toEqual(ShapefileType.point);
            await shapefile.close();
        } finally {
            Utils.clearShapefiles(filePath);
        }
    });
});