export default interface IFeature {
    id: number;
    geometry: any;
    properties: Map<string, any>;
    type: string;
}