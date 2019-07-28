import fs from 'fs';

import Shp from "../../src/shp/Shp";
import { ShapefileType } from "../../src/shared";
import * as Utils from './Utils';
import { Polygon, LinearRing } from 'ginkgoch-geom';

describe('Shp - create', () => {
    it('createEmpty', async () => {
        const filePathShp = './tests/data/new_polygons_tmp.shp';

        try {
            const shp = Shp.createEmpty(filePathShp, ShapefileType.polygon);

            expect(fs.existsSync(filePathShp)).toBeTruthy();
            const filePathShx = filePathShp.replace(/.shp$/g, '.shx');
            expect(fs.existsSync(filePathShx)).toBeTruthy();

            await shp.open();
            expect(shp.count()).toBe(0);
            await shp.close();

        } finally {
            Utils.clearShapefiles(filePathShp);
        }
    });

    it('create and push', async () => {
        const filePathShp = './tests/data/new_push_polygons_tmp.shp';
        try {
            const shp = Shp.createEmpty(filePathShp, ShapefileType.polygon);
            await shp.open();

            const polygon1 = new Polygon(new LinearRing([
                { x: 0, y: 0 },
                { x: 100, y: 0 },
                { x: 100, y: 100 },
                { x: 0, y: 100 },
                { x: 0, y: 0 },
            ]));
            polygon1.id = 1;
            shp.push(polygon1);
            await shp.close();

            shp._flag = 'rs';
            await shp.open();
            expect(shp.count()).toBe(1);
            const polygon1_ = await shp.get(0);
            expect(polygon1_).toEqual(polygon1);
            await shp.close();
        } finally {
            Utils.clearShapefiles(filePathShp);
        }
    });
});