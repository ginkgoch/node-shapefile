export default class Openable {
    isOpened : boolean;

    constructor() {
        this.isOpened = false;
    }

    open() {
        if (this.isOpened) return this;

        this.isOpened = true;
        this._open();
        return this;
    }

    protected _open() { }

    close() {
        if(this.isOpened) {
            this._close();
            this.isOpened = false;
        }
    }

    protected _close() { }

    openWith(action: () => void) {
        try {
            this.open();
            action();
        } finally {
            this.close();
        }
    }
}