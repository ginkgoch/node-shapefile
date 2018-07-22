module.exports = class Validators {
    static checkShapefileIsOpened(isOpened) {
        if(!isOpened) {
            throw 'Shapefile not opened. Call open() method first.';
        }
    }

    static checkIsValidShapeType(actual, expected, expectedName) {
        if(actual !== expected) {
            throw `Not a ${expectedName} record.`;
        }
    }
}