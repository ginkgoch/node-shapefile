import Optional from "../../src/base/Optional";

describe('Optional', () => {
    it('create optional', () => {
        let a = new Optional<string>('Hello')
        expect(a.hasValue).toBeTruthy()
        expect(a.value).toEqual('Hello')

        a = new Optional<string>(undefined)
        expect(a.hasValue).toBeFalsy()
        expect(a.value).toBeUndefined()
    })
})