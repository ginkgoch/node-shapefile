const Shapefile = require('./libs/Shapefile');
const StreamReader = require('ginkgoch-stream-reader');

async function load() {
    const citiesShp = new Shapefile('./tests/data/cities_e.shp');
    await citiesShp.open();

    const records = await citiesShp._readRecords();
    let record = await records.next();
    let count = 0;
    while (record && !record.done) {
        //console.log(record.value);
        count++;
        record = await records.next().catch(err => console.log(err));
    }

    console.log('done', count);
}

load();