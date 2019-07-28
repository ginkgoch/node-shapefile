import _ from "lodash";
import ShpReader from "../ShpReader";
import ShpWriter from "../ShpWriter";
import Validators from "../../shared/Validators";
import { ShapefileType } from "../../shared/ShapefileType";
import { IEnvelope, Envelope, ICoordinate, Geometry } from "ginkgoch-geom";

export default abstract class GeomParser {
    type: number
    reader: ShpReader | undefined
    envelope: IEnvelope | undefined

    constructor() {
        this.type = 0
    }

    read(reader: ShpReader): { envelope: IEnvelope, readGeom: () => Geometry } | null {
        this.reader = reader;
        this.type = this.reader.nextInt32LE();

        // TODO: maybe here could be this.type !== this.expectedType
        // then remove the following validator
        if (this.type === 0) {
            return null;
        }

        Validators.checkIsValidShapeType(this.type, this.expectedType, this.expectedTypeName);
        return this._read();
    }

    protected _read(): { envelope: IEnvelope, readGeom: () => Geometry } {
        this.envelope = this._reader.nextEnvelope();
        return { envelope: this.envelope, readGeom: this.readGeom.bind(this) };
    }

    getBuff(coordinates: any): Buffer {
        const size = this._size(coordinates);
        const buff = Buffer.alloc(size);
        const writer = new ShpWriter(buff);
        this.write(coordinates, writer);

        return buff;
    }

    write(coordinates: any, writer: ShpWriter): void {
        writer.writeInt32LE(this.type);
        if (this.type !== ShapefileType.point) {
            const envelope = Envelope.from(coordinates);
            writer.writeEnvelope(envelope);
        }

        this._write(coordinates, writer);
    }

    protected abstract _write(coordinates: any, writer: ShpWriter): void;

    abstract get expectedType(): ShapefileType;

    get expectedTypeName(): string {
        return this.expectedType.toString();
    }

    readGeom(): Geometry {
        return this._readGeom();
    }

    protected abstract _readGeom(): Geometry;

    get _reader() {
        return <ShpReader>this.reader;
    }

    protected abstract _size(coordinates: any): number;

    getGeomBuff(geom: Geometry): Buffer {
        const coordinates = geom.coordinates();
        const size = this._size(coordinates);
        const buff = Buffer.alloc(size);
        const writer = new ShpWriter(buff);
        this.write(coordinates, writer);

        return buff;
    }

    writeGeom(geom: Geometry, writer: ShpWriter): void {
        writer.writeInt32LE(this.type);
        if (this.type !== ShapefileType.point) {
            const envelope = geom.envelope();
            writer.writeEnvelope(envelope);
        }

        this._write(geom.coordinates(), writer);
    }
}