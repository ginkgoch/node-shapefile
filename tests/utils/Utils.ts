import fs from 'fs'

export function resolvePath(filename: string, ext = '.shp') {
    const DATA_ROOT = './tests/data/'
    return DATA_ROOT + filename + ext
}

export function clearShapefiles(filePath: string) {
    ['.shp', '.shx', '.dbf'].forEach(ext => {
        const temp = filePath.replace(/\.shp/g, ext);
        if (fs.existsSync(temp)) {
            fs.unlinkSync(temp);
        }
    });
}