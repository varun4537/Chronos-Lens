import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Coordinates } from '../types';
import L from 'leaflet';

// Fix for default leaflet marker icon not loading in Webpack/Vite environments usually
// We'll use a simple SVG or CDN link for the marker to be safe without importing assets
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  selectedCoords: Coordinates;
  onLocationSelect: (coords: Coordinates) => void;
}

const LocationMarker: React.FC<{ coords: Coordinates; onSelect: (c: Coordinates) => void }> = ({ coords, onSelect }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    map.flyTo([coords.lat, coords.lng], map.getZoom());
  }, [coords, map]);

  return <Marker position={[coords.lat, coords.lng]} icon={icon} />;
};

export const MapPicker: React.FC<MapPickerProps> = ({ selectedCoords, onLocationSelect }) => {
  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[selectedCoords.lat, selectedCoords.lng]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker coords={selectedCoords} onSelect={onLocationSelect} />
      </MapContainer>
      <div className="absolute bottom-4 left-4 z-[400] bg-black/70 text-white text-xs p-2 rounded pointer-events-none">
        Click anywhere to move pin
      </div>
    </div>
  );
};