import _ from "lodash";
import ShpReader from "../ShpReader";
import ShpWriter from "../ShpWriter";
import IEnvelope from "../IEnvelope";
import Validators from "../../shared/Validators";
import { ShapefileType } from "../../shared/ShapefileType";
import Envelope from "../Envelope";

export default abstract class GeomParser {
    type: number
    reader: ShpReader|undefined
    envelope: IEnvelope|undefined

    constructor() {
        this.type = 0
        this.envelope = undefined
    }

    read(reader: ShpReader): {envelope: IEnvelope, readGeom: () => {type: ShapefileType, coordinates: any}}|null {
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

    //TODO: can flat the type and coordinates.
    protected _read(): {envelope: IEnvelope, readGeom: ()=>{type: ShapefileType, coordinates: any}} {
        this.envelope = this._reader.nextEnvelope();
        return { envelope: this.envelope, readGeom: this.readGeom.bind(this) };
    }

    write(coordinates: any, writer: ShpWriter): void {
        writer.writeInt32LE(this.type);
        if (this.type !== ShapefileType.point) {
            const envelope = Envelope.from(GeomParser.vertices(coordinates));
            writer.writeEnvelope(envelope);
        }

        this._write(coordinates, writer);
    }

    protected abstract _write(coordinates: any, writer: ShpWriter): void;

    abstract get expectedType(): ShapefileType;

    get expectedTypeName(): string {
        return this.expectedType.toString();
    }

    readGeom(): {type: ShapefileType, coordinates: any} {
        return {type: this.type, coordinates: this._readGeom()};
    }

    protected abstract _readGeom(): any;

    get _reader() {
        return <ShpReader>this.reader;
    }

    static vertices(coordinates: any): number[][] {
        const vertices = new Array<number[]>();
        const flatten = _.flattenDeep(coordinates) as number[];
        for(let i = 0; i < flatten.length; i += 2) {
            vertices.push([flatten[i], flatten[i+1]]);
        }

        return vertices;
    }
}