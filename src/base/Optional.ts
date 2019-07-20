

export default class Optional<T> {
    obj: T|undefined

    constructor(obj: T|undefined) {
        this.obj = obj
    }

    get hasValue() {
        return this.obj !== undefined
    }

    get value() {
        return <T>this.obj
    }
}