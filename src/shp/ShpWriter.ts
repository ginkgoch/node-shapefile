import { BufferWriter } from "ginkgoch-buffer-io";
import IEnvelope from "./IEnvelope";

export default class ShpWriter extends BufferWriter {
    writeEnvelope(envelope: IEnvelope) {
        this.writeDoubleLE(envelope.minx);
        this.writeDoubleLE(envelope.miny);
        this.writeDoubleLE(envelope.maxx);
        this.writeDoubleLE(envelope.maxy);
    }

    writePoint(point: number[]) {
        if (point.length < 2) {
            throw new Error(`Point is formed with at least 2 numbers (current count ${point.length}).`);
        }

        const [x, y] = point;
        this.writeDoubleLE(x);
        this.writeDoubleLE(y);
    }

    writeParts(parts: number[]) {
        for (let i = 0; i < parts.length; i++) {
            this.writeInt32LE(i);
        }
    }

    writePoints(points: number[][][]) {
        const parts = [];

        let index = 0;
        for (let i = 0; i < points.length; i++) {
            parts.push(index);
            for(let j = 0; j < points[i].length; j++) {
                this.writePoint(points[i][j]);
                index++;
            }
        }
    }
}