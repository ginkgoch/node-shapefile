export default abstract class Iterator<T> {
    abstract async next(): Promise<{ done: boolean, result: T }|{ done: boolean }>;

    protected _done(): { done: boolean } {
        return { done: true };
    }

    _continue(obj: T): { done: boolean, result: T } {
        return { done: false, result: obj };
    }
};