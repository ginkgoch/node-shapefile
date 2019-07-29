import fs from 'fs';
import Shx from '../../src/shx/Shx';

describe('shx tests', () => {
    const filePath = './tests/data/USStates.shx';

    test('get record count test', async () => {
        const shx = new Shx(filePath);
        await shx.openWith(() => {
            const count = shx.count();
            expect(count).toBe(51);
        });
    });

    test('read record test', async () => {
        const shx = new Shx(filePath);
        await shx.openWith(() => {
            const count = shx.count();
            let previousRec = shx.get(1);
            for(let i = 2; i <= count; i++) {
                const currentRec = shx.get(i);
                expect(currentRec.offset).toBe(previousRec.offset + previousRec.length + 8);
                previousRec = currentRec;
            }
        });
    });

    test('remove record test', async () => {
        const filePathToDelete = './tests/data/USStates_delete_test.shx';
        fs.copyFileSync(filePath, filePathToDelete);

        const shx = new Shx(filePathToDelete, 'rs+');
        await shx.openWith(() => {
            try {
                const count = shx.count();
                expect(count).toBe(51);

                const id = 30;
                shx.removeAt(id);
                const record = shx.get(id);
                expect(record.length).toBe(0);
            } finally {
                fs.unlinkSync(filePathToDelete);
            }
        });
    });

    test('updateAt', async () => {
        const filePathToDelete = './tests/data/USStates_update_test.shx';
        fs.copyFileSync(filePath, filePathToDelete);

        const shx = new Shx(filePathToDelete, 'rs+');
        await shx.openWith(() => {
            try {
                const id = 30, offset = 356, length = 488;
                
                shx.updateAt(id, offset, length);

                const record = shx.get(id);
                expect(record.offset).toBe(offset);
                expect(record.length).toBe(length);
            } finally {
                fs.unlinkSync(filePathToDelete);
            }
        });
    });
});