import ShpReader from "../ShpReader";
import IEnvelope from "../IEnvelope";
import Validators from "../../shared/Validators";
import { ShapefileType } from "../../shared/ShapefileType";

export default abstract class GeomParser {
    type: number
    reader: ShpReader|undefined
    envelope: IEnvelope|undefined

    constructor() {
        this.type = 0
        this.envelope = undefined
    }

    prepare(reader: ShpReader): {envelope: IEnvelope, readGeom: () => {type: ShapefileType, coordinates: any}}|null {
        this.reader = reader;
        this.type = this.reader.nextInt32LE();

        // TODO: maybe here could be this.type !== this.expectedType
        // then remove the following validator
        if (this.type === 0) {
            return null;
        }

        Validators.checkIsValidShapeType(this.type, this.expectedType, this.expectedTypeName);
        return this._prepare();
    }

    protected _prepare(): {envelope: IEnvelope, readGeom: ()=>{type: ShapefileType, coordinates: any}} {
        this.envelope = this._reader.nextEnvelope();
        return { envelope: this.envelope, readGeom: this.readGeom };
    }

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
}