import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet"; // Icon config

const position = [51.505, -0.09]; // Arbitrary center. 
const zoomLevel = 13; // Set zoom level


const Map = ({ markers }) => {
    // Create the default icon for the marker
    const defaultIcon = new L.Icon({
        iconUrl: require("leaflet/dist/images/marker-icon.png"),  // Default Leaflet marker image
        iconSize: [25, 41], // Default marker size
        iconAnchor: [12, 41], // Anchor point for positioning the icon
        popupAnchor: [1, -34], // Popup position relative to the marker
        shadowUrl: require("leaflet/dist/images/marker-shadow.png"), // Optional shadow for the marker
        shadowSize: [41, 41], // Shadow size
        shadowAnchor: [12, 41], // Anchor for the shadow
    });
    
	return (
        <div className="map-container" style={{ height: "100%", width: "100%" }}>
                <MapContainer center={position} zoom={zoomLevel} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
                        attribution="&copy; <a href='https://carto.com/attributions'>CartoDB</a>"
                    />
                    {/* Marker to show on the map. "markers" passed down in GameRoom */}
                    {markers.map((marker, index) => (
                        <Marker
                            key={index}
                            position={[marker.latitude, marker.longitude]}
                            icon={defaultIcon} 
                        >
                            <Popup>{marker.name}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            );
};

export default Map;
