const fs = require('fs');
const assert = require('assert');

module.exports = class Validators {
    static checkIsOpened(isOpened) {
        if(!isOpened) {
            throw 'Shapefile not opened. Call open() method first.';
        }
    }

    static checkIsValidShapeType(actual, expected, expectedName) {
        if(actual !== expected) {
            throw `Not a ${expectedName} record.`;
        }
    }

    static checkFileExists(filePath) {
       assert(fs.existsSync(filePath), `${filePath} not exists.`);
    }
}