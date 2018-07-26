module.exports = class Openable {
    constructor() {
        this.isOpened = false;
    }

    async open() {
        if (this.isOpened) return;

        this.isOpened = true;
        await this._open();
        return await Promise.resolve(this);
    }

    async _open() { }

    async close() {
        if(this.isOpened) {
            await this._close();
            this.isOpened = false;
        }
    }

    async _close() { }

    async openWith(action) {
        try {
            await this.open();
            await action();
        } finally {
            await this.close();
        }
    }
}