import _ from 'lodash';
import GeomParser from './GeomParser';
import Optional from '../../base/Optional';
import * as GeomParsers from './GeomParsers';
import EnumUtils from '../../shared/EnumUtils';
import { ShapefileType } from "../../shared/ShapefileType";

export default class GeomParserFactory {
    static getParser(type: ShapefileType): Optional<GeomParser> {
        const keyName = EnumUtils.getName<ShapefileType>(type, ShapefileType);
        if (_.isUndefined(keyName)) return new Optional<GeomParser>(undefined);

        const parser = _.get(GeomParsers, keyName);
        if (parser) {
            return new Optional(parser());
        } else {
            return new Optional<GeomParser>(undefined);
        }
    }
}