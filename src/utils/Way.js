//@flow

// Change type of tag and nodes
// export async function addWay(changeset: number, tag: Object, nodes: Array<number>): Promise {
import {endpoint, headers} from "../constants/OSMConstants";
import {addNode, initChangeset} from "./APIHelper";

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

export default { add, generateXML, addByNodes }