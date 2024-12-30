import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const position = [51.505, -0.09]; // ex: London coordinates
const zoomLevel = 13; // Set zoom level


const Map = () => {
	return (
        <div className="map-container" style={{ height: "100%", width: "100%" }}>
                <MapContainer center={position} zoom={zoomLevel} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                        attribution="&copy; <a href='https://carto.com/attributions'>CartoDB</a>"
                    />
                    {/* Marker to show on the map */}
                    <Marker position={position}>
                        <Popup>Popup!<br />Customize?</Popup>
                    </Marker>
                </MapContainer>
            </div>
            );
};

export default Map;
