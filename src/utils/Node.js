//@flow
import { headers, defaultTags, endpoint } from '../constants/OSMConstants';
import Node from "../OSMComponents/Node";
import React from "react";
import {OSMElementTypes} from "../constants/OSMElements";

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
        const parser = new DOMParser();
        const nodeXML = parser.parseFromString(response.text(), "text/xml");
        // return <Node xmlString={nodeXml.getElementsByTagName("node")[0]}/>; // TODO - React Component or ES6 Class?
        return parseXMLString(nodeXML.getElementsByTagName("node")[0]);
    } catch(err) {
        return "An error has occurred. Please try again later."//TODO;
    }
}

function parseXMLString(XMLString: string): Object {
    return {
        type: OSMElementTypes.NODE,
        id: parseInt(XMLString.getAttributeNode("id")),
        lat: parseFloat(XMLString.getAttributeNode("lat")),
        lon: parseFloat(XMLString.getAttributeNode("lon")),
        version: parseInt(XMLString.getAttributeNode("version")),
        changeset: parseInt(XMLString.getAttributeNode("version")),
        user: XMLString.getAttributeNode("user"),
        uid: parseInt(XMLString.getAttributeNode("uid")),
        visible: Boolean(XMLString.getAttributeNode("visible")),
        timestamp: new Date(Date.parse(XMLString.getAttributeNode("timestamp"))),
        tags: null // TODO - Parse Tags into K,V
    };
}

export default { add, generateXML };