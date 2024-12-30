import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const position = [51.505, -0.09]; // ex: London coordinates
const zoomLevel = 13; // Set zoom level


const Map = () => {
	return (
        <div className="map-container" style={{ height: "100%", width: "100%" }}>
                <MapContainer center={position} zoom={zoomLevel} style={{ height: "100%", width: "100%" }}>
                    {/* TileLayer defines the map tiles (e.g., OpenStreetMap) */}
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
