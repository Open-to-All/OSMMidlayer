// @flow

import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {
    initChangeset,
    addNode,
    addWay,
    addWayByNodes,
    handleCrossingJSON,
    handleSidewalkJSON, handleCurbRampShapeFile
} from './utils/APIHelper';
import {smallcrossings, smallsidewalks} from "./JsonData/smalljsons";
import shp from 'shpjs';
import {inCoord} from "./utils/ShapeFileUtils";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lat: '',
            lon: '',
            tags: '',
            nodes: '',
            changeset: 'N/A',
            geojson: '', // TODO - DELETE
            selectedGeoJson: 'default',
            shpfile: null,
            ullat: '',
            ullon: '',
            lrlat: '',
            lrlon: '',
            dsc: '',
        };

        this.handleLat = this.handleLat.bind(this);
        this.handleLon = this.handleLon.bind(this);
        this.handleTags = this.handleTags.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.handleNodes = this.handleNodes.bind(this);
        this.handleSubmitWay = this.handleSubmitWay.bind(this);

        // TODO - Get Rid Of GEOJSON READING
        this.handleSelect= this.handleSelect.bind(this);
        this.handleJson = this.handleJson.bind(this);
        this.handleSubmitJson = this.handleSubmitJson.bind(this);
        // this.handleSidewalkGeoJSON = this.handleSidewalkGeoJSON.bind(this);
        // this.handleCrossingGeoJSON = this.handleCrossingGeoJSON.bind(this);
        this.state.json = JSON.parse(smallsidewalks); //list
        // console.log(this.state.json);

        // FILE UPLOAD
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.handleNewFile = this.handleNewFile.bind(this);
        this.handleULLat = this.handleULLat.bind(this);
        this.handleULLon = this.handleULLon.bind(this);
        this.handleLRLat = this.handleLRLat.bind(this);
        this.handleLRLon = this.handleLRLon.bind(this);

        this.handleChangesetDesc = this.handleChangesetDesc.bind(this);
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    {this.renderFileInputForm() }
                    {/*{this.renderNodeForm()}*/}
                    {console.log("does this work?")}
                </header>
            </div>
        );
    }

    renderGenerateChangeset() {
        return (
            <form onSubmit={this.handleNewChangeset.bind(this)}>
                Current Changeset: {this.state.changeset}
                <br/>
                <label>
                    Changeset Description:
                    <textarea value={this.state.csd} onChange={this.handleChangesetDesc}/>
                </label>
                <br/>
                <input type="submit" value="Create Changeset"/>
            </form>
            // <button onClick={this.handleNewChangeset.bind(this)}>
            //     {`Generate New Changeset: ${this.state.changeset}`}
            // </button>
        )
    }

    renderNodeForm() {
        return (
            <div>
                <button onClick={this.handleNewChangeset.bind(this)}>
                    {`Generate New Changeset: ${this.state.changeset}`}
                </button>
                <br/>
                <br/>
                <form onSubmit={this.handleSubmitJson}>
                    <label>
                        geojson:
                        <textarea value={this.state.geojson} onChange={this.handleJson}/>
                    </label>
                    <br/>
                    <select value={this.state.selectedGeoJson} onChange={this.handleSelect}>
                        <option value="default">Select Type</option>
                        <option value="crossings">crossings</option>
                        <option value="sidewalks">sidewalks</option>
                    </select>
                    <br/>
                    <input type="submit" value="Submit"/>
                </form>
            </div>
        );
    }

    renderTestingForm(){
        return (
            <div>
                <button onClick={this.handleNewChangeset.bind(this)}>
                    {`Generate New Changeset: ${this.state.changeset}`}
                </button>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Latitude:
                        <input type="text" value={this.state.lat} onChange={this.handleLat}/>
                    </label>
                    <br/>
                    <label>
                        Longitude:
                        <input type="text" value={this.state.lon} onChange={this.handleLon}/>
                    </label>
                    <br/>
                    <br/>
                    <label>
                        Tags:
                        <textarea value={this.state.tags} onChange={this.handleTags}/>
                    </label>
                    <br/>
                    <input type="submit" value="Create Node"/>
                </form>
                <br/>
                <form onSubmit={this.handleTodo/*this.handleSubmitWay*/}>
                    <label>
                        Nodes:
                        <textarea value={this.state.nodes} onChange={this.handleNodes}/>
                    </label>
                    <br/>
                    <input type="submit" value="Create Way"/>
                </form>
            </div>


        );
    }

    renderFileInputForm() {
        return(
            <div>
                {this.renderGenerateChangeset()}
                <form onSubmit={this.handleFileUpload}>
                    <label>
                        ShapeFile (.zip)
                        <input type='file' onChange={ (f) => this.handleNewFile(f.target.files)}/>
                    </label>
                    <br/>
                    <label>
                        Upper Left Latitude:
                        <input type="text" value={this.state.ullat} onChange={this.handleULLat}/>
                    </label>
                    <br/>
                    <label>
                        Upper Left Longitude:
                        <input type="text" value={this.state.ullon} onChange={this.handleULLon}/>
                    </label>
                    <br/>
                    <br/>
                    <label>
                        Lower Right Latitude:
                        <input type="text" value={this.state.lrlat} onChange={this.handleLRLat}/>
                    </label>
                    <br/>
                    <label>
                        Lower Right Longitude:
                        <input type="text" value={this.state.lrlon} onChange={this.handleLRLon}/>
                    </label>
                    <br/>
                    <label>
                        Changeset:
                        <input type="text" value={this.state.changeset} onChange={this.handleChangeset.bind(this)}/>
                    </label>
                    <br/>
                    <input type="submit" value="Add Nodes from Shapefile"/>
                </form>
            </div>
        )
    };

    handleNewFile(files) {
        this.setState({shpfile: files[0]});
    }
    handleFileUpload(event) {
        event.preventDefault();
        console.log("upload");
        if (!this.state.shpfile) {
            alert('Please upload a shape file');
        } else {
            const changeset = this.state.changeset;
            const ullat = this.state.ullat;
            const ullon = this.state.ullon;
            const lrlat = this.state.lrlat;
            const lrlon = this.state.lrlon;
            const file = this.state.shpfile;
            const fileData = new FileReader();
            fileData.readAsArrayBuffer(file);
            fileData.onload = function () {
                const file = fileData.result;
                shp(file).then(function (data) {
                        const geojsons = data.features;
                        // 30.27197
                        //-97.74544
                        // 30.26996
                        // -97.74242
                        handleCurbRampShapeFile(inCoord(ullat, ullon, lrlat, lrlon, geojsons), changeset).then(
                            response => {
                                for (const el of response) {
                                    console.log(el);
                                }
                            }
                        );
                    }
                );
            };
        }
    }

    handleULLat(event) {
        this.setState({ullat: event.target.value});
    }
    handleULLon(event) {
        this.setState({ullon: event.target.value});
    }
    handleLRLat(event) {
        this.setState({lrlat: event.target.value});
    }
    handleLRLon(event) {
        this.setState({lrlon: event.target.value});
    }


    handleSubmit(event) {
        event.preventDefault();
        console.log("hell0");
        // createNode(this.state.tags, this.state.lat, this.state.lon);
        addNode(136331, this.state.tags, this.state.lat, this.state.lon);
    }

    handleLat(event) {
        this.setState({lat: event.target.value});
    }

    handleLon(event) {
        this.setState({lon: event.target.value});
    }

    handleTags(event) {
        this.setState({tags: event.target.value});
    }

    handleSubmitWay(event) {
        event.preventDefault();
        addWayByNodes(136654, this.state.tags, {lat: 47.65317, lon: -122.30571}, {lat: 47.65322, lon: -122.3056}).then(
            response => console.log(response)
        );
    }

    handleNodes(event) {
        this.setState({nodes: event.target.value});
    }

    handleNewChangeset(event) {
        event.preventDefault();
        initChangeset().then(changeset => this.setState({changeset}));
    }

    handleChangeset(event) {
        event.preventDefault();
        this.setState({changeset: event.target.value})
    }

    handleJson(event) {
        this.setState({geojson: event.target.value})
    }

    handleSelect(event) {
        this.setState({selectedGeoJson: event.target.value});
    }

    handleSubmitJson(event) {
        event.preventDefault();
        const geoJson = this.state.selectedGeoJson;
        if (geoJson == 'crossings') {
            this.handleCrossingGeoJSON();
        } else if (geoJson == 'sidewalks') {
            this.handleSidewalkGeoJSON()
        }
    }

    handleCrossingGeoJSON() {
        handleCrossingJSON(this.state.json.features).then(response => {
            for (const el in response) {
                console.log(el);
            }
        });
    }

    handleSidewalkGeoJSON() {
        handleSidewalkJSON(this.state.json.features).then(response => {
            for (const el in response) {
                console.log(el);
            }
        });
    }

    handleChangesetDesc(event) {
        this.setState({csd: event.target.value})
    }



}

export default App;
