//@flow
import React from 'react';
import Node from '../OSMComponents/Node';

// TODO: Use await instead of then
const headers = new Headers(
    {
        'Content-Type': 'text/xml; charset=utf-8',
        'Authorization': 'Basic ' + btoa('nthnll@uw.edu:fqXD89cHhg8LARZB') // TODO: oauth?
    }
);

const defaultTags = "<tag k=\"project\" v=\"OSM-Midlayer\"";

// TODO TODO TODO - Handle adding project tag
/* CHANGESET */

//TODO - Add error code handling
// Will want to store this as a state
export async function initChangeset(comment?: string) {
    const changeset_xml = "<osm>\n" +
        "  <changeset>\n" +
        "    <tag k=\"created_by\" v=\"OSM-Midlayer\"/>\n" +
        "    <tag k=\"comment\" v=\"Playing with API\"/>\n" +
        "  </changeset>\n" +
        "</osm>";

    try {
        const initChangesetResponse = await fetch(
            'https://master.apis.dev.openstreetmap.org/api/0.6/changeset/create',
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


// TODO - Error, Combine with AddNode
export function createNode(tags, lat, lon) {
    initChangeset().then(changeset => addNode(changeset, tags, lat, lon));
}

/**
 *
 * @param lat
 * @param lon
 * @param tags
 * @param changeset
 */
export async function addNode(changeset: number,  tags?: string, lat: number, lon: number) {
    const xml_string = "<osm>\n" +
        " <node changeset=\"" + changeset + "\" lat=\"" + lat +"\" lon=\"" + lon + "\">\n" +
        tags +
        " </node>\n" +
        "</osm>";
    const response = await fetch(
        'https://master.apis.dev.openstreetmap.org/api/0.6/node/create',
        {
            method: 'PUT',
            headers,
            body: xml_string
        }
    );
    const id = response.text();
    return id;
}

export async function readNode(id: number) {
    try {
            const response = await fetch(
                `https://master.apis.dev.openstreetmap.org/api/0.6/node/${id}`,
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
export async function addWay(changeset: number, tags?: string, nodes: number): Promise {
    const xml_string = `<osm><way changeset="${changeset}">${tags}${nodes}</way></osm>`;
    console.log(xml_string);
    try {
        if (!changeset) {
            changeset = await initChangeset("Adding a Way"); // TODO
        }

        const id = await fetch(
            'https://master.apis.dev.openstreetmap.org/api/0.6/way/create',
            {
                method: 'PUT',
                headers,
                body: xml_string
            }
        ).then(response => response.text());
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
export async function addWayByNodes(changeset: number, tags?: string, nodeStart: Object, nodeEnd: Object) {
    try {
        if(!changeset) {
            changeset = await initChangeset("Adding a Way"); // TODO
        }
        // TODO - Separtae Way Tags and Node Tags
        const nodeStartId = await addNode(changeset, null, nodeStart.lat, nodeStart.lon);
        const nodeEndId = await addNode(changeset, null, nodeEnd.lat, nodeEnd.lon);
        return await addWay(changeset, tags, [wayNodeXML(nodeStartId), wayNodeXML(nodeEndId)]);
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
export async function handleCrossingJSON(crossingList: Array) {
    let response = [];
    for (const el in crossingList) {
        const json = crossingList[el];
        let tags = '';
        const properties = json.properties;
        console.log(properties);
        tags += createTag('sloped_curb',properties.curbramps ? 'yes' : 'no');
        if (!properties.marked) {
            tags += createTag('crossing', 'unmarked');
        }

        if (properties.street_name) {
            tags += createTag('name', properties.street_name);
        }

        // for (const key of Object.keys(crossingJson.properties)) { // TODO - will need to map GEOJSON to OSM
        // }
        const nodeStartCoor = json.geometry.coordinates[0];
        const nodeStart = {lon: nodeStartCoor[0], lat: nodeStartCoor[1]};
        const nodeEndCoor = json.geometry.coordinates[1];
        const nodeEnd = {lon: nodeEndCoor[0], lat: nodeEndCoor[1]};
        response.push(await(addWayByNodes(136744, tags, nodeStart, nodeEnd)));
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
        let tags = '';
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

// export async function addCrossing