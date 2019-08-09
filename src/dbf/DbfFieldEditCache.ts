import DbfField from "./DbfField";

export default class DbfFieldEditCache {
    addedFields: DbfField[];
    removedFields: string[];
    updatedFields: Map<string, DbfField>;

    constructor() {
        this.addedFields = new Array<DbfField>();
        this.removedFields = new Array<string>();
        this.updatedFields = new Map<string, DbfField>();
    }

    pushField(field: DbfField) {
        this.addedFields.push(field);
    }

    removeField(fieldName: string) {
        this.removedFields.push(fieldName);
    }

    updateField(fieldName: string, newField: DbfField) {
        this.updatedFields.set(fieldName, newField);
    }
}