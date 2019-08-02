# Shapefile Reader
This is a NodeJs library to help to read/write [Shapefile](https://en.wikipedia.org/wiki/Shapefile) from your disk.  

## Feature List
1. Query records from Shapefile
1. Append new records into Shapefile
1. Update a specified record in Shapefile
1. Remove a record
1. Create an empty Shapefile by a specified shape type.

## Tutorial
### Prerequisite
1. Node.js installed in your machine.
1. Install `ginkgoch-shapefile` package.
```terminal
yarn add ginkgoch-shapefile
```

### Code template for querying
In this section, we are going to operate the Shapefile. Before kick off, we need to open the shapefile in case we have everything prepared. We provide three ways to open the shapefile. Choose either one as you use to.
1. Regular way
    ```typescript
    const statesShp = new Shapefile('./tests/data/USStates.shp');
    statesShp.open();

    // put your business logic here.

    statesShp.close();
    ```
1. Fluent way to open
    ```typescript
    const statesShp = new Shapefile('./tests/data/USStates.shp').open();

    // put your business logic here.

    statesShp.close();
    ```
1. Callback way to open (auto close when callback complete)
    ```typescript
    const statesShp = new Shapefile('./tests/data/USStates.shp').openWith(() => {
        // put your business logic here.
    });
    ```

###  Query Records
In this section, we are going to show you how to iterate shapefile records, get a specific record by id, and how to work with querying filters.

#### Query record by id
Let's start from a normal case - get record by id.
```typescript
const statesShp = new Shapefile('./tests/data/USStates.shp').open();
const record = statesShp.get(1); // all ids are started from 1.
```

| Note: record is a structure formed with `geometry` and `properties`.

#### Get all records
This method fetches all records at once.
```typescript
const records = statesShp.records();
console.log(records.length);
```

#### Iterate records
In previous section, we get all the records at once. It is convenient but it will take much memory usage for sure. Iterator allows to get all features in another way to get records one after another.
```typescript
const iterator = statesShp.iterator();
let record = undefined;
while ((record = iterator.next()) && !iterator.done) {
    console.log(record);
}
```

#### Use filter
We allow to filter the records by following conditions.
1. from - The start id of the record to fetch. Default is 1.
1. limit - The limited record count to fetch. Default is Number.Max.
1. envelope - The envelope structure that all the records within will be fetched. e.g. `{ minx: -180, miny: -90, maxx: 180, maxy: 90 }`.
1. fields - The fields to fetch from dbf file. Options are:
    - `undefined` - Not defined, by default, all fields will be fetched.
    - `all` - Same as `undefined`.
    - `none` - Ignore the dbf querying.
    - `string[]` - A specified field name list to fetch. e.g. `["RECID", "NAME"]`.

Here is a demo to fetch records from id `10` to `19`, properties include `RECID` and `STATE_NAME`.
```typescript
const records = statesShp.records({ from: 10, limit: 10, fields: ['RECID', 'STATE_NAME'] });
```

### Code template for editing
Before appending new record, we need to do a little change before opening the `Shapefile`. Specify the file flag to 'rs+' or whatever flags to allow the file is able to edit.
```typescript
const shapefile = new Shapefile(filePath, 'rs+');
shapefile.open();

// put your business logic here.

shapefile.close();
```

### Append new record
A `record` is named as `Feature` in Ginkgoch. Let's create a feature first. Then push this feature into `shapefile` instance. Then Done.
```typescript
const feature = new Feature(new Point(0, 0), { NAME: 'Tokyo', POP: 1.268 });
shapefile.push(feature);
```

### Update a record
Updating a record is similar as appending a new record. The only difference is that, the feature to update requires a valid id.

```typescript
const feature = new Feature(new Point(0, 0), { NAME: 'Tokyo', POP: 1.268 }, 1 /* the record id to update */);
shapefile.update(feature);
```

### Remove a record
Specify an id to delete.

```typescript
shapefile.remove(1); // remove the record whose id is 1.
```

### Create new shapefile
To create a new shapefile, we need to prepare the following factors.
1. The new shapefile path to store.
1. The shape type to contain inside. Options are: `point`, `polyLine`, `polygon` and `multiPoint`.
1. The fields info.

```typescript
const fields = new Array<DbfField>();
fields.push(new DbfField('RECID', DbfFieldType.number));
fields.push(new DbfField('NAME', DbfFieldType.character, 10));

const shapefile = Shapefile.createEmpty(filePath, ShapefileType.point, fields);
// here the shapefile instance is created with flag 'rs+'. Call open() method to continue appending new records.
```

## Issues
Contact [ginkgoch@outlook.com](mailto:ginkgoch@outlook.com) or [submit an issue](https://github.com/ginkgoch/node-shapefile/issues).





