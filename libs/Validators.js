const fs = require('fs');
const path = require('path');
const assert = require('assert');
const _ = require('lodash');

module.exports = class Validators {
    static checkIsOpened(isOpened) {
        if(!isOpened) {
            throw 'Shapefile not opened. Call open() method first.';
        }
    }

    static checkIndexIsValid(index) {
        assert(index >= 0, 'Index must greater than or equal to 0.')
    }

    static checkIsValidShapeType(actual, expected, expectedName) {
        if(actual !== expected) {
            throw `Not a ${expectedName} record.`;
        }
    }

    static checkFileExists(filePath, exts = undefined) {
        const files = new Set();
        files.add(filePath);

        if(exts && _.isArray(exts)) {
            exts.map(f => filePath.replace(/\.\w+$/, f).trim()).forEach(f => files.add(f));
        }

        files.forEach(Validators._checkFileExists);
    }

    static _checkFileExists(filePath) {
        const basename = path.basename(filePath);
        assert(fs.existsSync(filePath), `${basename} not exists.`);
    }
}