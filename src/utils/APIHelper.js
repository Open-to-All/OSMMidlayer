//@flow
import React from 'react';
import Node from '../utils/Node';
import Way from '../utils/Way';
import { headers, defaultTags, endpoint } from '../constants/OSMConstants'
import * as turf from '@turf/turf'
import {OSMElementTypes} from "../constants/OSMElements";
// AC: wondering what the OSMComponents/Way is for given that you have ways here but not importing that file

// TODO: Use await instead of then
// const headers = new Headers(
//     {
//         'Content-Type': 'text/xml; charset=utf-8',
//         'Authorization': 'Basic ' + btoa('nthnll@uw.edu:fqXD89cHhg8LARZB') // TODO: oauth?
//         //AC: we should use our OAuth server for this purpose.
//     }
// );
//
// const defaultTags = "<tag k=\"project\" v=\"opensidewalks\"/>";
//
// const endpoint = 'https://master.apis.dev.openstreetmap.org/api/0.6/';
// const endpoint =  'https://api.openstreetmap.org/api/0.6/';

// TODO TODO TODO - Handle adding project tag
/* CHANGESET */

//TODO - Add error code handling
// Will want to store this as a state

// TODO - take a look at other tags https://wiki.openstreetmap.org/wiki/Changeset#Tags_on_changesets
export async function initChangeset(comment = "Playing with API") {
    const changeset_xml = `<osm><changeset><tag k="created_by" v="OSM-Midlayer"/><tag k="comment" v="${comment}"/>`
        + "</changeset></osm>";
    console.log('Changeset: ' + changeset_xml);
    try {
        //AC: wondering about your hard coding the endpoint throughout since you defined that as a string above
        const initChangesetResponse = await fetch(
            endpoint + 'changeset/create',
            {
                method: 'PUT',
                headers,
                body: changeset_xml
            }
        );
        const changesetNumber = initChangesetResponse.text();
        return changesetNumber;
    } catch(err) {
        return "An error has occurred. Please try again later."//TODO;
    }
}

// NODE
// ---------------------------------------------------------------------------------------------------------------------
/**
 *
 * @param lat
 * @param lon
 * @param tags
 * @param changeset
 */
export async function addNode(changeset: number,  tags?: string, lat: number, lon: number) {
    tags = tags ? tags : '';
    // TODO - es6 var injection
    const xml_string = "<osm>\n" +
        " <node changeset=\"" + changeset + "\" lat=\"" + lat +"\" lon=\"" + lon + "\">\n" +
        tags +
        " </node>\n" +
        "</osm>";
    // console.log(xml_string);
    const response = await fetch(
        endpoint + 'node/create',
        {
            method: 'PUT',
            headers,
            body: xml_string
        }
    );
    if (!response.ok) {
        console.log(`StatusText: ${response.statusText} \n XML: ${xml_string}`);
    }
    const id = response.text();
    return id;
}

export async function readNode(id: number) {
    try {
        const response = await fetch(
            endpoint + `node/${id}`,
            {
                method: 'GET',
                headers
            }
        );
        const parser = new DOMParser();
        const nodeXml = parser.parseFromString(response.text(), "text/xml");
        return <Node xmlString={nodeXml.getElementsByTagName("node")[0]}/>; // TODO - React Component or ES6 Class?
    } catch(err) {
        return "An error has occurred. Please try again later."//TODO;
    }
}

// WAY
// ---------------------------------------------------------------------------------------------------------------------

// Change type of tag and nodes
// export async function addWay(changeset: number, tag: Object, nodes: Array<number>): Promise {
export async function addWay(changeset: number, tags?: string, nodes: string): Promise {
    const xml_string = `<osm><way changeset="${changeset}">${tags}${nodes}</way></osm>`;
    // console.log(xml_string);
    try {
        if (!changeset) {
            return "Must give a changeset";
        }

        const id = await fetch(
            endpoint + 'way/create',
            {
                method: 'PUT',
                headers,
                body: xml_string
            }
        ).then(
            response => {
                if (!response.ok) {
                    console.log(`StatusText: ${response} \n XML: ${xml_string}`);
                }
                return response.text();
            }
        );
        alert("Way Created: " + id);
        return id;
    } catch (err) {
        return err;
    }
}

/**
 *
 * @param changeset
 * @param tags
 * @param nodeStart - Must have keys lat, lon
 * @param nodeEnd - Must have keys lat, lon
 * @returns {Promise<*>}
 */
export async function addWayByNodes(changeset: number, tags?: string, nodes: Array<Object>) {
    try {
        if(!changeset) {
            changeset = await initChangeset("Adding a Way"); // TODO
        }
        // TODO - Separate Way Tags and Node Tags
        let nodeXMLs = '';
        for (const node of nodes) {
            nodeXMLs += wayNodeXML(await addNode(changeset, null, node.lat, node.lon));
        }
        return await addWay(changeset, tags, nodeXMLs);
    } catch (err) {
        return err;
    }
}

// TODO move to javascript object?
function wayNodeXML(id: number) {
    return `<nd ref="${id}"/>`;
}

/**
 * @param crossingList
 * @returns {Promise<void>}
 */
//AC: this should be generalized in terms of having a JSON describing how the node or way objects need to be tagged based on the XML input.
//AC: I also see that you have a scope problem where you are creating the crossing into a hard coded changeset. 
export async function handleCrossingJSON(crossingList: Array) {
    console.log("hello");
    let response = [];
    const total = crossingList.length;
    let curr = 1618; //skipped 1616
    // for (const el in crossingList) {
    for (let i = curr; i < total; i++) {
        console.log(`${i} of ${total}`);
        const json = crossingList[i];
        console.log(json);
        let tags = '';
        const properties = json.properties;
        // console.log(properties);
        // tags += createTag('sloped_curb',properties.curbramps ? 'yes' : 'no');
        // if (!properties.marked) {
        //     tags += createTag('crossing', 'unmarked');
        // }
        //
        // if (properties.street_name) {
        //     tags += createTag('name', properties.street_name);
        // }
        for (const key in properties) { // TODO - will need to map GEOJSON to OSM
            // TODO - strip '</>' characters?
            if (properties[key] == '<Null>') {
                properties[key] = 'null';
            }
            tags += createTag(key, properties[key]);
        }
        const geomType = json.geometry.type;
        // TODO: Actually handle cases
        let line;
        // TODO - combine strings
        if(geomType == 'MultiLineString') {
            line = json.geometry.coordinates[0];
        } else if (geomType == 'Point') {
            const coor = json.geometry.coordinates;
            response.push(addNode(147223, tags, coor[1], coor[0]));
        } else if (geomType == 'GeometryCollection') {
          // const geometries = json.geometry.geometries;
          // todo
        } else {
            line = json.geometry.coordinates;
            let nodes = [];
            for (const node of line) {
                nodes.push({lon: node[0], lat: node[1]})
            }
            response.push(await(addWayByNodes(147223, tags, nodes)));
        }

    }
    return response;
}
/*


COMPTYPE: 97
CONDITION: "FAIR"
CONDITION_ASSESSMENT_DATE: 1496880000000
CURBRAMPHIGH: "U"
CURBRAMPLOW: "U"
CURBRAMPMID: "U"
CURBTYPE: "410C"
CURRENT_STATUS: "INSVC"
CURRENT_STATUS_DATE: 1190827054000
DATE_MVW_LAST_UPDATED: 1532547746000
DISTANCE: 13
ENDDISTANCE: 122
FILLERTYPE: "LSCP"
FILLERWID: 90
INCSTPOINTLOWEND: 0
INCSTPOINTUNKNOWN: "N"
INVALIDSWRECORDYN: "N"
LENUOM: "Feet"
MAINTBYRDWYSTRUCTYN: "N"
MULTIPLESURFACEYN: "N"
NOTSWCANDIDATEYN: "N"
NUM_ATTACHMENTS: 1
OVERRIDECOMMENT: ""
OVERRIDEYN: "N"
PRIMARYCROSSSLOPE: 1.5
PRIMARYDISTRICTCD: "DISTRICT2"
SECONDARYDISTRICTCD: " "
SRTS_SIDEWALK_RANK: 1
SWINCOMPLETEYN: "N"
Shape_Length: 108.00614804358369
UNITDESC: "S BENNETT ST BETWEEN 17TH W AVE S AND 17TH E AVE S, N SIDE                                                                                                                                                                                                     "
UNITID: "SDW-40269"
UNITTYPE: "SDW"
forward: 1
incline: -15;
layer: 0
length: 28.553684770838267; SAME
pkey: 314716
side: "N"
street_name: "S BENNETT ST"; name=*
streets_pkey: 19496
surface: "concrete"; SAME
width: 1.524; SAME
 */
// https://wiki.openstreetmap.org/wiki/Key:footway
export async function handleSidewalkJSON(sidewalkList: Array) {
    let response = [];
    for (const el in sidewalkList) {
        const json = sidewalkList[el];
        let tags = '';
        const properties = json.properties;
        // console.log(properties);
        tags += createTag('highway', 'footway');
        tags += createTag('footway', 'sidewalk');
        if  (properties.street_name) {
            tags += createTag('name', properties.street_name);
        }

        if (properties.width) {
            tags += createTag('width', properties.width);
        }
        if (properties.length) {
            tags += createTag('length', properties.length);
        }
        if (properties.surface) {
            tags += createTag('surface', properties.surface);
        }
        const nodeStartCoor = json.geometry.coordinates[0];
        const nodeStart = {lon: nodeStartCoor[0], lat: nodeStartCoor[1]};
        const nodeEndCoor = json.geometry.coordinates[1];
        const nodeEnd = {lon: nodeEndCoor[0], lat: nodeEndCoor[1]};
        response.push(await(addWayByNodes(136748, tags, nodeStart, nodeEnd)));
    }
    return response;
}

// Currently only handling specific format
export async function handleCurbRampShapeFile(geojsons, changeset) {
    let response = [];

    for (const geojson of geojsons) {
        let tags = defaultTags;

        // TODO - Refactor required Kerb Tags
        tags += createTag('kerb', 'lowered');
        tags += createTag('barrier', 'kerb');

        tags += createTag('tactile_paving', 'yes');
                let description = '';
        // Parse Keys
        console.log(geojson);
        for (const key of Object.keys(geojson.properties)) {
            const value = geojson.properties[key];
            if (value && !(value instanceof Date && isNaN(value.valueOf()))) {
                switch (key) {
                    case 'ADDRESS_DE':
                        tags += createTag('name', value);
                        break;
                    default:
                        description += `${key} = ${geojson.properties[key]}\n`;
                }
            }
        }

        if (description) {
            tags += createTag('description', `Unhandled Data: \n ${description}`);
        }

        const coords = geojson.geometry.coordinates;
        response.push(await(addNode(changeset, tags, coords[1], coords[0])));
    }
    return response;
}

function createTag(k: string, v: string) {
    return `<tag k="${k}" v="${v}"/>`;
}

export function parseToXML(text: string) {
    const parser = new DOMParser();
    return parser.parseFromString(text, 'text/xml');
}

export function parseToOSMElements(text: string) {
    const xml = parseToXML(text);
    const nodes = xml.getElementsByTagName('node');
    const ways = xml.getElementsByTagName('way');
    const relations = xml.getElementsByTagName('relation');
    return {nodes, ways, relations}
}


// TODO - Should we create geoms right away? Or leave that also up to an option / diff api call
export function parseXMLElementsToObj(elements: Object): Object {
    const nodes = Node.parseAll(elements['nodes']);
    const ways = Way.parseAll(elements['ways']);
    // const relations = Relation.parseAll(elements['relations']); TODO?
    return {nodes, ways}
}


// TODO - OSM returns all of the nodes of any way that enters into the bounding box (nodes outside of bbox)
export async function getBoundingBox(top: number, right: number, bottom: number, left: number) {
    try {

        const elements = await fetch(
            endpoint + `map?bbox=${left},${bottom},${right},${top}`,
            {
                method: 'GET',
                headers
            }
        ).then(response => response.text()
        ).then(xml_string => parseToOSMElements(xml_string));
        return elements;
    } catch (err) {
        return err;
    }
}

// TODO - Want to Generalize
// export function filterToElement(elements: Object, ) {
//
// }

// Get crosswalks and Curbs
// Elements should be of form:
// {
//     nodes: list of nodes,
//     ways: list of ways,
//     relations: list of relations
// }
// As parsed by parseXMLElementsToObj
export function getCrossingElements(elements: Object) {
    Way.associateNodesToWays(elements.ways, elements.nodes);
    let curbs = [], crossings = [], sidewalks = [];
    for (const node of elements.nodes) {
        // TODO - BETTER STYLE???
        if (node.tags['kerb'] == 'lowered') {
            curbs.push(node);
        }
    }

    for (const way of elements.ways) {
        if (way.tags['highway'] == 'footway') {
            if (way.tags['footway'] == 'crossing') {
                crossings.push(way);
            } else if (way.tags['footway'] == 'sidewalk') {
                sidewalks.push(way);
            }
        }
    }
    return {curbs, crossings, sidewalks}
}

// TODO - Might deprecate in favor of forcing geoms ; esp because of ways' issue
function checkAndInitGeom(element: Object) {
    if (!element.geom) {
        if (element.type == OSMElementTypes.NODE) {
            Node.associateGeom(element)
        } else if (element.type == OSMElementTypes.WAY) {
            if (!element.node_objs) {
                throw "Way does not have associated node_objs"
            }
            Way.associateGeom(element, element.node_objs);
        }
    }
}

function getNearestWay(node: Object, ways: Object[]): Object {
   checkAndInitGeom(node);
    let nearestWay;
    let shortestDist;
    for (const way of ways) {
        if (!way.geom) {
            // TODO - Throw error if way.node_objs uninit? Or design so never a problem
            Way.associateGeom(way, way.node_objs);
        }
        const currDist = turf.pointToLinDistance(node.geom, way.geom);
        if (!shortestDist || currDist < shortestDist) {
            shortestDist = currDist;
            nearestWay = way;
        }
    }
    return nearestWay;
}



function nearestPointOnLine(node: Object, way: Object): Object {
    checkAndInitGeom(node);
    checkAndInitGeom(way);
    const nearestPoint = turf.nearestPointOnLine(way.geom, node.geom);
    return nearestPoint.geometry.coordinates;

}


export async function linkCurbToSidewalk(curbs: Object, sidewalks: Object) {
    for (const curb of curbs) {
        const nearestSidewalk = getNearestWay(curb, sidewalks);
        // Edit sidewalk to link to, add node at point to snap
        // Add way snap
        const linkTo = nearestPointOnLine(curb, nearestSidewalk);
        // TODO - in order to add the node to the way, we'll have to find the two nodes the node is in between, this probably means we'll have to check for intersection between each node and if the node is directly between two ways
        const linkToLon = linkTo.geometry.coordinates[0];
        const linkToLat = linkTo.geometry.coordinates[1];
        const linkNode = Node.asNode(undefined, linkToLat, linkToLon);

        // Generate Tags for CurbLink
        let tags = createTag('footway', 'sidewalk');
        tags += createTag('highway', 'footway');
        // Add node and get id
        const changeset = 0;
        console.error("Breakpoint lul");
        const linkNodeId = await addNode(changeset, tags, linkToLat, linkToLon);

        // TODO - Factor out?
        // Find where the node should be in the way space / geom
        // Want to use turf.booleanPointOnLine, but isn't super accurate so we'll look for the nearest line segment
        const coor = nearestSidewalk.geometry.coordinates;
        let minDist = undefined;
        let outerPoints = [];
        for (let i = 0; i < coor.length - 1; i++) {
            const currLine = turf.lineString([coor[i], coor[i+1]]);
            const currDist = turf.pointToLineDistance(linkTo, currLine);
            if (!minDist || currDist < minDist) {
                minDist = currDist;
                outerPoints = [coor[i], coor[i+1]];
            }
        }

        // Gen new list of ids
        let newIds = nearestSidewalk.nodes.splice(0);

        // Each id corresponds to a node, go through the node until we find where to insert the new node
        const nodeObjs = nearestSidewalk.node_objs;
        for (let i = 0; i < nodeObjs.length - 1; i++) {
            const coor1 = [nodeObjs[i].lat, nodeObjs[i].lon];
            const coor2 = [nodeObjs[i+1].lat, nodeObjs[i+1].lon];
            if (
                coor1[0] == outerPoints[0][0] &&
                coor1[1] == outerPoints[0][1] &&
                coor2[0] == outerPoints[1][0] &&
                coor2[1] == outerPoints[1][1]
            ) {
                newIds.splice(linkNodeId, i + 1, 0); // TODO - maybe also add new node into other system
            }
        }

        // Now that we know where the new point goes, add the
        // Add linkTo Node API CALL
        // Add way from curb to linkTo Node
        // API CALL
    }
}

// 47.65526,-122.31228
// 47.65546,-122.31188

export function parseTags(element: Object) {
    const XMLtags = element.getElementsByTagName('tag');
    const tags = {};
    for (const tag of tags) {

    }
}
// export async function addCrossing
