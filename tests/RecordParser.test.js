const Parser = require('../libs/RecordParser');
const ShapefileType = require('../libs/ShapefileType');

describe('parser tests', () => {
    test('get parser test 1', async () => {
        let pointParser = Parser.getParser(1);
        expect(pointParser).not.toBeNull();

        pointParser = Parser.getParser(ShapefileType.Point);
        expect(pointParser).not.toBeNull();

        expect(() => {
            Parser.getParser(0);
        }).toThrow(/Unsupported/);
    });
});