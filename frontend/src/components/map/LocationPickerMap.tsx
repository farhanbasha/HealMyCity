"use client";

import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Leaflet default icon fix
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
    });
}

function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom(), { animate: true });
    }, [lat, lng, map]);
    return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function LocationPickerMap({
    coords,
    onChange,
}: {
    coords: { lat: number; lng: number };
    onChange: (coords: { lat: number; lng: number }) => void;
}) {
    const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
    const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileAttribution = cartoKey
        ? '&copy; <a href="https://carto.com/">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const center: [number, number] = [coords.lat, coords.lng];

    const eventHandlers = useMemo(
        () => ({
            dragend(e: L.DragEndEvent) {
                const marker = e.target;
                const pos = marker.getLatLng();
                onChange({ lat: pos.lat, lng: pos.lng });
            },
        }),
        [onChange]
    );

    return (
        <div className="w-full h-56 rounded-xl overflow-hidden border border-[#E5E5EA] relative z-0">
            <MapContainer
                center={center}
                zoom={14}
                scrollWheelZoom={false}
                className="w-full h-full"
            >
                <MapUpdater lat={coords.lat} lng={coords.lng} />
                <MapClickHandler
                    onClick={(lat, lng) => {
                        onChange({ lat, lng });
                    }}
                />
                <TileLayer
                    attribution={tileAttribution}
                    url={tileUrl}
                    subdomains={cartoKey ? "abcd" : "abc"}
                    maxZoom={19}
                />
                <Marker
                    position={center}
                    draggable={true}
                    eventHandlers={eventHandlers}
                />
            </MapContainer>
            <div className="absolute bottom-2 left-2 z-1000 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-medium text-[#1D1D1F] border border-[#E5E5EA] shadow-xs pointer-events-none">
                💡 Drag pin or click anywhere on map to reposition
            </div>
        </div>
    );
}
