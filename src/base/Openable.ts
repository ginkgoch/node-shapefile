export default class Openable {
    isOpened : boolean;

    constructor() {
        this.isOpened = false;
    }

    async open() {
        if (this.isOpened) return;

        this.isOpened = true;
        await this._open();
        return await Promise.resolve(this);
    }

    protected async _open() { }

    async close() {
        if(this.isOpened) {
            await this._close();
            this.isOpened = false;
        }
    }

    protected async _close() { }

    async openWith(action: () => void) {
        try {
            await this.open();
            await action();
        } finally {
            await this.close();
        }
    }
}