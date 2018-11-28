// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Node extends Component {
    static propTypes = {
        xmlString: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);
        if (props.xmlString) {
            this.state = Node.parseXmlString(props.xmlString);
        }
    }

    render() {
        return (
            <div>Node.render() not implemented</div>
        )
    }

    static parseXmlString(xmlString: string): Object {
        return {
            id: parseInt(xmlString.getAttributeNode("id")),
            lat: parseFloat(xmlString.getAttributeNode("lat")),
            lon: parseFloat(xmlString.getAttributeNode("lon")),
            version: parseInt(xmlString.getAttributeNode("version")),
            changeset: parseInt(xmlString.getAttributeNode("version")),
            user: xmlString.getAttributeNode("user"),
            uid: parseInt(xmlString.getAttributeNode("uid")),
            visible: Boolean(xmlString.getAttributeNode("visible")),
            timestamp: new Date(Date.parse(xmlString.getAttributeNode("timestamp"))),
            tags: null // TODO
        };
    }
}

export default Node;