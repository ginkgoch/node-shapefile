// Type definitions for ginkgoch-buffer-io 1.0
// Project: https://github.com/ginkgoch/node-buffer-io
// Definitions by: My Self <https://github.com/ginkgoch>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare module 'ginkgoch-buffer-io' {
    export class BufferReader {
        constructor(...args: any[]);

        nextBuffer(...args: any[]): void;

        nextDouble(...args: any[]): void;

        nextDoubleBE(...args: any[]): void;

        nextDoubleLE(...args: any[]): void;

        nextFloat(...args: any[]): void;

        nextFloatBE(...args: any[]): void;

        nextFloatLE(...args: any[]): void;

        nextInt16(...args: any[]): void;

        nextInt16BE(...args: any[]): void;

        nextInt16LE(...args: any[]): void;

        nextInt32(...args: any[]): void;

        nextInt32BE(...args: any[]): void;

        nextInt32LE(...args: any[]): void;

        nextInt8(...args: any[]): void;

        nextString(...args: any[]): void;

        nextUInt16(...args: any[]): void;

        nextUInt16BE(...args: any[]): void;

        nextUInt16LE(...args: any[]): void;

        nextUInt32(...args: any[]): void;

        nextUInt32BE(...args: any[]): void;

        nextUInt32LE(...args: any[]): void;

        nextUInt8(...args: any[]): void;

        seek(...args: any[]): void;

    }

    export class BufferWriter {
        constructor(...args: any[]);

        seek(...args: any[]): void;

        writeBuffer(...args: any[]): void;

        writeDouble(...args: any[]): void;

        writeDoubleBE(...args: any[]): void;

        writeDoubleLE(...args: any[]): void;

        writeFloat(...args: any[]): void;

        writeFloatBE(...args: any[]): void;

        writeFloatLE(...args: any[]): void;

        writeInt16(...args: any[]): void;

        writeInt16BE(...args: any[]): void;

        writeInt16LE(...args: any[]): void;

        writeInt32(...args: any[]): void;

        writeInt32BE(...args: any[]): void;

        writeInt32LE(...args: any[]): void;

        writeInt8(...args: any[]): void;

        writeString(...args: any[]): void;

        writeUInt16(...args: any[]): void;

        writeUInt16BE(...args: any[]): void;

        writeUInt16LE(...args: any[]): void;

        writeUInt32(...args: any[]): void;

        writeUInt32BE(...args: any[]): void;

        writeUInt32LE(...args: any[]): void;

        writeUInt8(...args: any[]): void;

    }
}

