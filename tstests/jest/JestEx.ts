// const _ = require('lodash');

import _ from 'lodash';
import 'jest';
import Optional from '../../src/base/Optional';

expect.extend({
    toBeGeneralRecord: (received: any, id = 1) => {
        const current = <Optional<{ id: number, geometry: any }>>received;
        expect(current).not.toBeNull();
        expect(current).not.toBeUndefined();
        expect(current.value.id).toBe(id);

        const geom = current.value.geometry;
        expect(geom).not.toBeNull();
        expect(geom).not.toBeUndefined();

        return { pass: true, message: '' };
    },

    toBeNullOrUndefined: (actual: any) => {
        return { pass: _.isNull(actual) || _.isUndefined(actual), message: '' };
    },

    toBeClosePointTo: (actual: any, expected: any, numDigit = 4) => {
        let x = undefined;
        let y = undefined;

        if(expected instanceof Array) {
            [x, y] = expected;
        } 
        else {
            [x, y] = [expected.x, expected.y];
        }

        expect(actual.coordinates[0]).toBeCloseTo(x, numDigit);
        expect(actual.coordinates[1]).toBeCloseTo(y, numDigit);
        return { pass: true, message: '' };
    },

    toBeClosePolyLineTo: (actual: any, expected: any, numDigit = 4) => {
        let pointArrays = <number[][]>_.chunk(expected, 2);
        expect(actual.coordinates.length).toBe(2);
        expect(actual.coordinates.length).toBe(pointArrays.length);
        for(let i in <number[][]>actual.coordinates) {
            expect(actual.coordinates[i][0]).toBeCloseTo(pointArrays[i][0], numDigit);
            expect(actual.coordinates[i][1]).toBeCloseTo(pointArrays[i][1], numDigit);
        }

        return { pass: true, message: '' };
    }
});