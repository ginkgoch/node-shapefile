const fs = require('fs');
const path = require('path');
const Shapefile = require('./libs/Shapefile');
const Stopwatch = require('statman-stopwatch');

async function loopRecords() {
    const shpPath = path.join(__dirname, 'tests/data/USStates.shp');
    const shp = new Shapefile(shpPath);
    await shp.open();

    const r = await shp.get(0);
    console.log(r);
}
loopRecords();