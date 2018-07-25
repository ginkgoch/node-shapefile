const fs = require('fs');
const Shapefile = require('./libs/Shapefile');
const Stopwatch = require('statman-stopwatch');

async function loopRecords() {
    const citiesShp = new Shapefile('./tests/data/USStates.shp');
    await citiesShp.open();

    const sw = new Stopwatch();
    sw.start();
    const records = await citiesShp.readRecords();
    let count = 0;
    let record = undefined;
    while ((record = await records.next()) && !record.done) {
        count++;
        // console.log(record);
    }
    sw.stop();
    console.log(sw.read());
    console.log('done', count);
}

function loadDbf() {
    const dbfPath = './tests/data/USStates.dbf';
    const fd = fs.openSync(dbfPath, 'r');
    
    const ldid = fd.readUInt8(1);
    console.log(ldid);
}

// loopRecords();
loadDbf();