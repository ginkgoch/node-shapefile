describe('DbfRecord tests', () => {
    it('buffer write', () => {
        let buff = Buffer.alloc(4);
        buff.write('Hello World');
        let str = buff.toString();
        expect(str).toBe('Hell');
    })
});