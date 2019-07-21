import ShpReader from "../ShpReader";
import IEnvelope from "../IEnvelope";
import Validators from "../../shared/Validators";
import { ShapefileType } from "../../shared/ShapefileType";

export default abstract class GeomParser {
    type: number
    reader: ShpReader
    envelope: IEnvelope|undefined
    isPoint: boolean

    constructor(reader: ShpReader) {
        this.type = 0
        this.reader = reader
        this.envelope = undefined
        this.isPoint = false
    }

    prepare(): {envelope: IEnvelope, readGeom: ()=>{type: ShapefileType, coordinates: any}}|null {
        this.type = this.reader.nextInt32LE();

        // TODO: maybe here could be this.type !== this.expectedType
        // then remove the following validator
        if (this.type === 0) {
            return null;
        }

        Validators.checkIsValidShapeType(this.type, this.expectedType, `expected shape type ${this.expectedType}`);
        return this._prepare();
    }

    protected _prepare(): {envelope: IEnvelope, readGeom: ()=>{type: ShapefileType, coordinates: any}} {
        this.envelope = this.reader.nextEnvelope();
        return { envelope: this.envelope, readGeom: this.readGeom };
    }

    abstract get expectedType(): ShapefileType;

    readGeom(): {type: ShapefileType, coordinates: any} {
        return {type: this.type, coordinates: this._readGeom()};
    }

    protected abstract _readGeom(): any;
}