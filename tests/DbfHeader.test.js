const fs = require('fs')
const DbfHeader = require('../libs/dbf/DbfHeader')

describe('DbfHeader tests', () => {
    const filePath = './tests/data/USStates.dbf'

    test('read header test', async () => {
        const _fd = fs.openSync(filePath, 'rs')
        const header = new DbfHeader()
        header.read(_fd)

        console.log(header)
    })
})