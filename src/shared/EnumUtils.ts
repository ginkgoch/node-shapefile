import _ from "lodash";

export default class EnumUtils {
    static getName<T>(value: T, enumType: any) {
        for (let key in enumType) {
            if (enumType[key] === value) {
                return key;
            }
        }

        return undefined;
    }
}