// NOTE: You must import 'leaflet/dist/leaflet.css' in your main entry point (e.g., main.tsx) for the map to display correctly.
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L, { LatLngTuple, Icon, DivIcon } from 'leaflet';

// Demo coordinates (Dhaka)
const userLocation: LatLngTuple = [23.8103, 90.4125];
const hospitalLocation: LatLngTuple = [23.7806, 90.4070];
const route: [LatLngTuple, LatLngTuple] = [hospitalLocation, userLocation];
const ANIMATION_DURATION = 30 * 1000; // 30 seconds

const ambulanceIcon: Icon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2967/2967350.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function AnimatedMarker({ route, duration }: { route: [LatLngTuple, LatLngTuple], duration: number }) {
  const [position, setPosition] = useState<LatLngTuple>(route[0]);
  const startTimeRef = useRef<number>(Date.now());
  const map = useMap();

  useEffect(() => {
    map.fitBounds([route[0], route[1]], { padding: [50, 50] });
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);
      const lat = route[0][0] + (route[1][0] - route[0][0]) * t;
      const lng = route[0][1] + (route[1][1] - route[0][1]) * t;
      setPosition([lat, lng]);
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
    // eslint-disable-next-line
  }, [route, duration]);

  return <Marker position={position} icon={ambulanceIcon} />;
}

const MapDemo = ({ direction = 'hospitalToUser' }: { direction?: 'hospitalToUser' | 'userToHospital' }) => {
  const points: [LatLngTuple, LatLngTuple] = direction === 'hospitalToUser' ? route : ([...route].reverse() as [LatLngTuple, LatLngTuple]);
  return (
    <MapContainer center={points[0]} zoom={13} style={{ height: 300, width: '100%', borderRadius: 16, zIndex: 1 }} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={points} pathOptions={{ color: 'red', weight: 5 }} />
      <AnimatedMarker route={points} duration={ANIMATION_DURATION} />
      <Marker position={points[0]} icon={L.divIcon({ className: 'start-marker', html: '🏥', iconSize: [24, 24] } as L.DivIconOptions)} />
      <Marker position={points[1]} icon={L.divIcon({ className: 'end-marker', html: '🏠', iconSize: [24, 24] } as L.DivIconOptions)} />
    </MapContainer>
  );
};

export default MapDemo; 