const fs = require('fs');
const _ = require('lodash');
const Validators = require('./Validators');
const Openable = require('./base/StreamOpenable');
const ShapefileIt = require('./ShapefileIterator');
const Shp = require('./shp/Shp');
const Shx = require('./shx/Shx');
const Dbf = require('./dbf/Dbf');
const extReg = /\.\w+$/;

module.exports = class Shapefile extends Openable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    /**
     * @override
     */
    async _open() {
        Validators.checkFileExists(this.filePath, ['.shp', '.shx', '.dbf']);

        this._shp = new Shp(this.filePath);
        await this._shp.open();

        const filePathShx = this.filePath.replace(extReg, '.shx');
        this._shx = new Shx(filePathShx);
        await this._shx.open();

        const filePathDbf = this.filePath.replace(extReg, '.dbf');
        this._dbf = new Dbf(filePathDbf);
        await this._dbf.open();
    }

    /**
     * @override
     */
    async _close() {
        if(this._shp) {
            await this._shp.close();
            this._shp = undefined;
        }
        
        if(this._shx) {
            await this._shx.close();
            this._shx = undefined;
        }

        if(this._dbf) {
            await this._dbf.close();
            this._dbf = undefined;
        }
    } 

    async readRecords() {
        Validators.checkIsOpened(this.isOpened);
        const shpIt = await this._shp.readRecords();
        const dbfIt = await this._dbf.readRecords();
        const shapefileIt = new ShapefileIt(shpIt, dbfIt);
        return shapefileIt;
    }
    
    async get(id) {
        Validators.checkIsOpened(this.isOpened);
        const geom = await this._shp.get(id);
        const fields = await this._dbf.get(id);
        return { geom, fields };
    }
}