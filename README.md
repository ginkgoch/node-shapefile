# Shapefile Reader
This is a NodeJs library to help to read shapefiles from your disk.  

## Install
```terminal
npm i ginkgoch-shapefile-reader
```

## Test
```terminal
npm test
```

## Sample
### Loops all records and print the vertices
```js
async function loopUSStates(callback) {
    const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
    const iterator = await statesShp.iterator();
    let record = undefined;
    while ((record = await iterator.next()) && !record.done) {
        callback(record);
    }
    await statesShp.close();
}
```

### Gets specific record by id

Gets records by id with all fields.
```js
async function getRecordById(id) {
    const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
    const record = await statesShp.get(0);
    await statesShp.close();

    // returns { geom: { geom: /**geom points*/, envelope: { minx, miny, maxx, maxy } }, fields: { name1: value1 ... } }
    return record;
}
```

Gets records by id with none fields. Specify the fields to fetch from DBF to ignore reading unnecessary field values.
```js
async function getRecordById(id) {
    const statesShp = await new Shapefile('./tests/data/USStates.shp').open();
    const record = await statesShp.get(0, []);
    await statesShp.close();

    // returns { geom: { geom: /**geom points*/, envelope: { minx, miny, maxx, maxy } }, fields: { } }
    return record;
}
```

## Issues
Contact [ginkgoch@outlook.com](mailto:ginkgoch@outlook.com) or [sumbit an issue](https://github.com/ginkgoch/node-shapefile-reader/issues).





