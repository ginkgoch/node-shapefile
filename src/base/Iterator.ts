export default abstract class Iterator<T> {
    done: boolean;
    constructor() {
        this.done = false;
    }

    abstract async next(): Promise<T|undefined>;

    protected _done(): undefined {
        this.done = true
        return undefined
    }

    _continue(obj: T): T {
        this.done = false
        return obj;
    }
};