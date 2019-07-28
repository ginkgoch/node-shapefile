export default class Openable {
    isOpened : boolean;

    constructor() {
        this.isOpened = false;
    }

    //TODO: can it be sync?
    async open() {
        if (this.isOpened) return this;

        this.isOpened = true;
        await this._open();
        return this;
    }

    protected async _open() { }

    //TODO: can it be sync?
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