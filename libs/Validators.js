module.exports = class Validators {
    static checkShapefileIsOpened(isOpened) {
        if(!isOpened) {
            throw new Error('Shapefile not opened. Call open() method first.');
        }
    }
}