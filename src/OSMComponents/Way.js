// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Way extends Component {
    static propTypes = {
        xmlString: PropTypes.string.isRequired
    };

    constructor(props?: Object) {
        super(props);
        if (props.xmlString) {
            this.state = Way.parseXmlString(props.xmlString);
        }
    }

    render() {
        return (
            <div>Way.render() not implemented</div>
        )
    }

    // TODO - Make not node
    static parseXmlString(xmlString: string): Object {
        return {
            // id: parseInt(xmlString.getAttributeNode("id")),
            // lat: parseFloat(xmlString.getAttributeNode("lat")),
            // lon: parseFloat(xmlString.getAttributeNode("lon")),
            // version: parseInt(xmlString.getAttributeNode("version")),
            // changeset: parseInt(xmlString.getAttributeNode("version")),
            // user: xmlString.getAttributeNode("user"),
            // uid: parseInt(xmlString.getAttributeNode("uid")),
            // visible: Boolean(xmlString.getAttributeNode("visible")),
            // timestamp: new Date(Date.parse(xmlString.getAttributeNode("timestamp"))),
            // tags: null // TODO
        };
    }
    static generateXmlString(changeset: number, tags: object, nodeIds: Array<number>): string {
        let tagsXml;
        for (const key in tags) {
            tagsXml += `<tag k="${key}" v="${tags[key]}"`;
        }
        const nodesXml = nodeIds.map(id => `<nd ref="${id}"/>`).join('');
        return `<osm><way changeset=${changeset}>${tagsXml}${nodesXml}</way></osm>`;
    }
}

export default Way;