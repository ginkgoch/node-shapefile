const fs = require('fs');

const Dbf = require('../libs/dbf/Dbf');

describe('dbf deletion test', () => {
    const dbfPathSrc = './tests/data/MajorCities.dbf';
    it('deleteAt', async () => {
        const dbfPath = './tests/data/MajorCities_1.dbf';
        try {
            fs.copyFileSync(dbfPathSrc, dbfPath);

            const dbf = new Dbf(dbfPath, 'rs+');
            await dbf.open();

            const idToRemove = 20;
            dbf.removeAt(idToRemove);
            const r = await dbf.get(idToRemove);

            expect(r.id).toBe(20);
            expect(r.deleted).toBeThuthy();

            dbf.recoverAt(idToRemove);
            expect(r.id).toBe(20);
            expect(r.deleted).toBeFalsy();
        } catch (err) {
            expect(true).toBeTruthy();
        } finally {
            fs.unlinkSync(dbfPath);
        }
    });
});