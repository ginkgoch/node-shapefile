import fs from 'fs';
import path from 'path';
import assert from 'assert';
import _ from 'lodash';
import { ShapefileType } from './ShapefileType';

export default class Validators {
    static checkIsOpened(isOpened: boolean) {
        if(!isOpened) {
            throw 'Shapefile not opened. Call open() method first.';
        }
    }

    static checkIndexIsGEZero(index: number) {
        assert(index >= 0, 'Index must greater than or equal to 0.')
    }

    static checkIndexIsLessThan(index: number, max: number) {
        assert(index < max, `Index(${index}) must less than the ${max}.`)

    }

    static checkIsValidShapeType(actual: ShapefileType, expected: ShapefileType, expectedName: string) {
        if(actual !== expected) {
            throw `Not a ${expectedName} record.`;
        }
    }

    static checkFileExists(filePath: string, extensions?: string[]) {
        const files = new Set<string>();
        files.add(filePath);

        if(extensions && _.isArray(extensions)) {
            extensions.map(f => filePath.replace(/\.\w+$/, f).trim()).forEach(f => files.add(f));
        }

        files.forEach(Validators._checkFileExists);
    }

    static _checkFileExists(filePath: string) {
        const basename = path.basename(filePath);
        assert(fs.existsSync(filePath), `${basename} not exists.`);
    }
}