import FilterUtils from "../../src/shared/FilterUtils";

describe('FilterUtils', () => {
    it('normalizeFields', () => {
        let fields = FilterUtils.normalizeFields(undefined, fetchFields);
        expect(fields.length).toBe(2);

        fields = FilterUtils.normalizeFields('none', fetchFields);
        expect(fields.length).toBe(0);

        fields = FilterUtils.normalizeFields('all', fetchFields);
        expect(fields.length).toBe(2);

        fields = FilterUtils.normalizeFields(['NAME', 'AGE'], fetchFields);
        expect(fields.length).toBe(1);
    })
});

const fetchFields = () => ['RECID', 'NAME'];