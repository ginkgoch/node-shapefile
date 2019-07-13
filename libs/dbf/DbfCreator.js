const fs = require('fså')
const { StreamWriter } = require('ginkgoch-stream-io')

module.exports = class DbfCreator {
    constructor(filePath, options = {}) {
        this.filePath = filePath
        this.options = options
        this.streamWriter = null
    }

    async create() {
        return await new Promise(res => {
            if (!this.streamWriter) {
                const stream = fs.createWriteStream(this.filePath, this.options)
                this.streamWriter = new StreamWriter(stream)
            }

            res()
        })
        
    }

    async end() {
        if (this.streamWriter) {
            await this.streamWriter.end()
            this.streamWriter = null
        }
    }
}