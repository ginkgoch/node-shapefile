import Shp from "../../src/shp/Shp"
import Shapefile from "../../src/shapefile/Shapefile"
import * as Utils from './Utils'

describe('Shp edit', () => {
    const filePathSrc =  Utils.resolvePath('USStates');
    const polygon1 = [[[-111.4746322631836,44.702239990234375],[-111.48001098632812,44.69149398803711],[-111.45989990234375,44.670101165771484],[-111.45747375488281,44.65263366699219],[-111.46937561035156,44.64078903198242],[-111.50689697265625,44.63776779174805],[-111.4746322631836,44.702239990234375]]]
    
    it('push record', async () => {
        const filePath = Utils.resolvePath('USStates_test_push');
        Shapefile.copyFiles(filePathSrc, filePath);

        try {
            const shp = new Shp(filePath, 'rs+');
            await shp.open()
            const oldCount = shp.count()
            const lastRec1 = await shp.get(oldCount - 1);

            shp.push(polygon1)
            await shp.close()
            
            await shp.open()
            const recordCount = shp.count()
            expect(recordCount).toBe(oldCount + 1)
            const lastRec1_new = await shp.get(oldCount - 1)
            const polygon1_new = await shp.get(oldCount) as any

            expect(lastRec1_new).not.toBe(null);
            expect(lastRec1_new).toEqual(lastRec1)
            expect(polygon1_new.geometry.coordinates).toEqual(polygon1)
            expect(shp._shx.value.count()).toBe(recordCount);
            
        } finally {
            Utils.clearShapefiles(filePath);
        }
    })

    it('update record', async () => {
        const filePath = Utils.resolvePath('USStates_test_update');
        Shapefile.copyFiles(filePathSrc, filePath);

        try {
            const shp = new Shp(filePath, 'rs+');
            await shp.open()
            const oldCount = shp.count()
            const lastRec1 = await shp.get(oldCount - 1);

            const updateIndex = 35;

            shp.updateAt(updateIndex, polygon1)
            await shp.close()
            
            await shp.open()
            const recordCount = shp.count()
            expect(recordCount).toBe(oldCount)
            const lastRec1_new = await shp.get(oldCount - 1)
            const polygon1_new = await shp.get(updateIndex) as any

            expect(lastRec1_new).not.toBe(null);
            expect(lastRec1_new).toEqual(lastRec1)
            expect(polygon1_new.geometry.coordinates).toEqual(polygon1)
            expect(shp._shx.value.count()).toBe(recordCount);
            
        } finally {
            Utils.clearShapefiles(filePath);
        }
    })
})

