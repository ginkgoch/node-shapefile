import Optional from "./Optional";

export default abstract class Iterator<T> {
    done: boolean;
    constructor() {
        this.done = false;
    }

    abstract async next(): Promise<Optional<T>>;

    protected _done(): Optional<T> {
        this.done = true
        return new Optional<T>(undefined)
    }

    _continue(obj: T): Optional<T> {
        this.done = false
        return new Optional(obj);
    }

    _dirty(obj: null|undefined) {
        this.done = false
        return new Optional<T>(undefined);
    }
};