declare namespace jest {
    interface Matchers<R extends CustomMatcherResult> {
        toBeNullOrUndefined(): R;
        toBeGeneralRecord(id: number): R;
        toBeClosePointTo(expected: any, numDigit: number): R;
        toBeClosePolyLineTo(expected: any, numDigit: number): R;
    }
}