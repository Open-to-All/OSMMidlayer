//@flow
import { headers, defaultTags, endpoint } from '../constants/OSMConstants';
// import Node from "../utils/Node";
// import React from "react";
import {OSMElementTypes} from "../constants/OSMElements";
import * as turf from '@turf/helpers'


/**
 *
 * @param lat
 * @param lon
 * @param tags
 * @param changeset
 */
export async function add(changeset: number,  tags?: string, lat: number, lon: number) {
    const xml_string = generateXML(changeset, tags, lat, lon);
    const response = await fetch(
        endpoint + 'create',
        {
            method: 'PUT',
            headers,
            body: xml_string
        }
    );
    const id = response.text();
    return id;
}


function generateXML(changeset: number,  tags?: string, lat: number, lon: number) {
    return `<osm><node changeset="${changeset}" lat="${lat}" lon="${lon}">${tags}</node></osm>`;
}

async function readNode(id: number) {
    try {
        const response = await fetch(
            endpoint + `node/${id}`,
            {
                method: 'GET',
                headers
            }
        );
        //TODO use APIHElper
        const parser = new DOMParser();
        const nodeXML = parser.parseFromString(response.text(), "text/xml");
        // return <Node xmlString={nodeXml.getElementsByTagName("node")[0]}/>; // TODO - React Component or ES6 Class?
        return parseXMLToObj(nodeXML.getElementsByTagName("node")[0]);
    } catch(err) {
        return "An error has occurred. Please try again later."//TODO;
    }
}

function parseXMLToObj(xmlNode: XMLDocument): Object {
    const htmlNode = xmlNode.documentElement;
    const htmlTags = htmlNode.getElementsByTagName('tag');
    const tags = {};
    for (let i = 0; i < htmlTags.length; i++) {
        const tag = htmlTags[i];
        tags[tag.getAttribute('k')] = tag.getAttribute('v');
    }
    return {
        type: OSMElementTypes.NODE,
        id: parseInt(htmlNode.getAttribute('id')),
        lat: parseFloat(htmlNode.getAttribute("lat")),
        lon: parseFloat(htmlNode.getAttribute("lon")),
        version: parseInt(htmlNode.getAttribute("version")),
        changeset: parseInt(htmlNode.getAttribute("version")),
        user: htmlNode.getAttribute("user"),
        uid: parseInt(htmlNode.getAttribute("uid")),
        visible: Boolean(htmlNode.getAttribute("visible")),
        timestamp: new Date(Date.parse(htmlNode.getAttribute("timestamp"))),
        tags
    };
}

function parseAll(xmlNodes: XMLDocument[]): Object[] {
    const nodes = [];
    for (const xmlNode of xmlNodes) {
        nodes.push(parseXMLToObj(xmlNode));
    }
    return nodes;
}

function toGeom(node): Object {
    return turf.point(node['lon'], node['lat']);
}

function associateGeom(node: Object): Object {
    node['geom'] = toGeom(node);
}

function asNode(id?: number,
                lat: number, lon: number,
                version?: number, changeset?: number,
                user?: string, uid?: number,
                visible?: boolean, timestamp?: string,
                tags?: Object) {
    return {
        type: OSMElementTypes.NODE,
        id,
        lat,
        lon,
        version,
        changeset,
        user,
        uid,
        visible,
        timestamp,
        tags
    };
}

export default { add, generateXML, readNode, parseXMLToObj, parseAll, toGeom, associateGeom, asNode };