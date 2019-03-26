//@flow

// Change type of tag and nodes
// export async function addWay(changeset: number, tag: Object, nodes: Array<number>): Promise {
import {endpoint, headers} from "../constants/OSMConstants";
import {addNode, initChangeset} from "./APIHelper";
import {OSMElementTypes} from "../constants/OSMElements";
import * as turf from '@turf/helpers'


async function add(changeset: number, tags?: string, nodes: number): Promise {
    const xml_string = generateXML(changeset, tags, nodes);
    console.log(xml_string);
    try {
        if (!changeset) {
            return "Must give a changeset";
        }

        const id = await fetch(
            endpoint + 'create',
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

function generateXML(changeset: number, tags?: string, nodes: number) {
    const xml_string = `<osm><way changeset="${changeset}">${tags}${nodes}</way></osm>`;
}
/**
 *
 * @param changeset
 * @param tags
 * @param nodeStart - Must have keys lat, lon
 * @param nodeEnd - Must have keys lat, lon
 * @returns {Promise<*>}
 */
async function addByNodes(changeset: number, tags?: string, nodeStart: Object, nodeEnd: Object) {
    try {
        if(!changeset) {
            return "Must give a changeset";
        }
        // TODO - Separate Way Tags and Node Tags
        const nodeStartId = await addNode(changeset, null, nodeStart.lat, nodeStart.lon);
        const nodeEndId = await addNode(changeset, null, nodeEnd.lat, nodeEnd.lon);
        return await add(changeset, tags, [wayNodeXML(nodeStartId), wayNodeXML(nodeEndId)]);
    } catch (err) {
        return err;
    }
}

// TODO move to javascript object?
function wayNodeXML(id: number) {
    return `<nd ref="${id}"/>`;
}

function parseXMLToObj(xmlNode: XMLDocument): Object {
    const htmlWay = xmlNode.documentElement;
    const htmlTags = htmlWay.getElementsByTagName('tag');
    const tags = {};
    for (let i = 0; i < htmlTags.length; i++) {
        const tag = htmlTags[i];
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
    }

    const htmlNodes = htmlWay.getElementsByTagName('nd');
    const nodes = [];
    for (let i = 0; i < htmlNodes.length; i++) {
        const nd = htmlNodes[i];
        nodes.push(nd.getAttribute('ref'))
    }

    return {
        type: OSMElementTypes.WAY,
        id: parseInt(htmlWay.getAttribute('id')),
        version: parseInt(htmlWay.getAttribute("version")),
        changeset: parseInt(htmlWay.getAttribute("version")),
        user: htmlWay.getAttribute("user"),
        uid: parseInt(htmlWay.getAttribute("uid")),
        visible: Boolean(htmlWay.getAttribute("visible")),
        timestamp: new Date(Date.parse(htmlWay.getAttribute("timestamp"))),
        tags,
        nodes
    };
}

// TODO - BUG: A circular way will cause issues !!!!
/**
 * Gets the node objects that make up the way based on the way's node ids
 *
 * @param way
 * @param nodes
 * @returns {Array}
 */
function getNodeObjects(way: Object, nodes: Object[]) {
    const relevantNodes = [];
    const wayNodes = new Set(way['nodes']);
    for (const node of nodes) {
        const id = node['id'];
        if (wayNodes.has(id)) {
            relevantNodes.push(node);
            wayNodes.delete(id);
        }
        if(wayNodes.length <= 0) {
            break;
        }
    }
    return relevantNodes;
}

function associateNodesToWays(ways: Object[], nodes: Object[]) {
    for (const way of ways) {
        way['node_objs'] = getNodeObjects(way, nodes);
    }
}


function parseAll(xmlWays: XMLDocument[]): Object[] {
    const ways = [];
    for (const xmlWay of xmlWays) {
        ways.push(parseXMLToObj(xmlWay));
    }
    return ways;
}

function toGeom(way: Object, nodes: Object[] ): Object {
    const coors = [];
    for (const node of nodes) {
        coors.push([node['lon'], node['lat']]);
    }
    return turf.lineString(coors)
}

function associateGeom(way: Object, nodes: Object[] ): Object {
    way['geom'] = toGeom(way, nodes);
}

// function updateGeom (way:Object, lineString: Object) {
//     way['geom'] = lineString;
//     way['node_objs']
// }

export default { add, generateXML, addByNodes, parseXMLToObj, toGeom, associateGeom, associateNodesToWays, parseAll }