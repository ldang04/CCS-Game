import React, { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet"; // Icon config

const position = [51.505, -0.09]; // Arbitrary center

const defaultIcon = new L.Icon({
    iconUrl: require("leaflet/dist/images/marker-icon.png"), // Default Leaflet marker image
    iconSize: [25, 41], // Default marker size
    iconAnchor: [12, 41], // Anchor point for positioning the icon
    popupAnchor: [1, -34], // Popup position relative to the marker
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"), // Optional shadow for the marker
    shadowSize: [41, 41], // Shadow size
    shadowAnchor: [12, 41], // Anchor for the shadow
});

const ZoomToMarker = ({ markers }) => {
    const map = useMap();
    const prevMarkers = useRef([]);

    useEffect(() => {
        // Check if a new marker has been added
        if (markers.length > prevMarkers.current.length) {
            const newMarker = markers[markers.length - 1];
            map.flyTo([newMarker.latitude, newMarker.longitude], 15, {
                animate: true,
                duration: 1.5, // Duration of the animation in seconds
            });
        }
        prevMarkers.current = markers; // Update the ref with the latest markers
    }, [markers, map]);

    return null;
};

const Map = ({ markers }) => {
    const polylinePositions = markers.map((marker) => [marker.latitude, marker.longitude]);

    return (
        <div className="map-container">
            <MapContainer
                center={position}
                zoom={13}
                style={{
                    height: "100%",
                    width: "100%",
                    borderRadius: "1em",
                    overflow: "hidden",
                }}
                scrollWheelZoom={true}
                dragging={true}
                zoomControl={true}
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles © <a href="https://www.arcgis.com/home/item.html?id=2e4b3df6ba4b44969aba4b01cfa4fe45" target="_blank" rel="noopener noreferrer">Esri</a> — Source: Esri, USGS, NOAA'
                />

                {/* Automatically zoom and pan to new markers */}
                <ZoomToMarker markers={markers} />

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
                    <Polyline positions={polylinePositions} pathOptions={{ color: "blue", weight: 3 }} />
                )}
            </MapContainer>
        </div>
    );
};

export default Map;
