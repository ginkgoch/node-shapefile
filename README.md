# Shapefile Reader
This is a NodeJs library to help to read shapefiles from your disk.  

## Sample
### Loop all records and print the vertices
```js
async function loopRecords() {
    const citiesShp = new Shapefile('./tests/data/sample.shp');
    await citiesShp.open();

    const records = await citiesShp._readRecords();
    let count = 0;
    let record = undefined;
    while ((record = await records.next()) && !record.done) {
        count++;
        console.log(record);
    }

    console.log('done', count);
}
```

### Filter records to get better performance
Peek every records header and keep read the content when necessary. It has better reading performance.





