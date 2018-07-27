const Validators = require('../libs/Validators');

describe('validators tests', () => {
    const path = './tests/data/Austinstreets.shp';

    test('check file exists test - one file', () => {
        Validators.checkFileExists(path);
    });

    test('check file exists test - other files', () => {
        Validators.checkFileExists(path, ['.shp', '.shx', '.dbf']);
    });

    test('check file exists test - not exists', () => {
        function validateFunc() {
            Validators.checkFileExists(path, ['.rdx']);
        }

        expect(validateFunc).toThrow(/Austinstreets.rdx not exists./);
    })
});