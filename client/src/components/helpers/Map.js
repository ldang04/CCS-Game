import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet"; // Icon config

const position = [51.505, -0.09]; // Arbitrary center. 
const zoomLevel = 13; // Set zoom level

const ZoomPanToMarker = ({ markerPosition }) => {
    const map = useMap();  // Access the Leaflet map instance

    useEffect(() => {
        if (markerPosition) {
            // Zoom out, pan to the new marker, and zoom in
            map.flyTo(markerPosition, zoomLevel, {
                duration: 1,  // Duration of the zoom/pan
                animate: true,
            });
        }
    }, [markerPosition, map]);

    return null;
};

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

    // Prepare positions for Polyline
    const polylinePositions = markers.map((marker) => [marker.latitude, marker.longitude]);

    return (
        <div className="map-container" style={{ height: "100%", width: "100%" }}>
            <MapContainer center={position} zoom={zoomLevel} style={{ height: "100%", width: "100%", borderRadius: "1em", overflow: "hidden", }}>
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; <a href='https://carto.com/attributions'>CartoDB</a>"
                />
                
                {/* Render markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        position={[marker.latitude, marker.longitude]}
                        icon={defaultIcon} 
                    >
                        <Popup>{marker.name}</Popup>
                    </Marker>
                ))}

                {/* Render polyline connecting the markers */}
                {polylinePositions.length > 1 && (
                    <Polyline positions={polylinePositions} pathOptions={{ color: 'blue', weight: 3 }} />
                )}

                {/* ZoomPanToMarker will animate the map when a new marker is added */}
                {markers.length > 0 && (
                    <ZoomPanToMarker markerPosition={[markers[markers.length - 1].latitude, markers[markers.length - 1].longitude]} />
                )}
            </MapContainer>
        </div>
    );
};

export default Map;

