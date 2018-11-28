import shp from 'shpjs'

shp('../../regeojsonformat.zip').then( data => console.log(data));

/**
 *
 * @param ullat lat of upper left point
 * @param ullon lon of upper left point
 * @param lrlat lat of lower right point
 * @param lrlon lon or lower right point
 * @param geojsons array of geojsons
 */
export function     inCoord(ullat, ullon, lrlat, lrlon, geojsons) {
    return geojsons.filter(function(geojson) {
        const coord = geojson.geometry.coordinates;
        // console.log(coord);
        return coord[0] >= ullon &&
            coord[1] <= ullat &&
            coord[0] <= lrlon &&
            coord[1] >= lrlat
    });
}
