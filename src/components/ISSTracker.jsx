import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { RefreshCw, MapPin, Navigation, Users } from 'lucide-react';
import { useISSData } from '../hooks/useISSData';
import 'leaflet/dist/leaflet.css';

// Custom ISS Icon
const issIcon = new L.Icon({
  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

// Helper component to recenter map
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function ISSTracker() {
  const { position, path, speed, locationName, astros, error, forceRefresh } = useISSData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (forceRefresh) await forceRefresh();
    setTimeout(() => setIsRefreshing(false), 500); // just for visual feedback if very fast
  };

  if (error) {
    return (
      <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 flex flex-col items-center justify-center h-[400px]">
        <Navigation className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-semibold">{error}</p>
        <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {/* Map Section */}
      <div className="rounded-2xl overflow-hidden border border-[hsl(var(--border))]/50 shadow-xl shadow-black/5 h-[450px] relative bg-[hsl(var(--card))]/50 backdrop-blur-xl group">
        
        {/* Absolute Refresh Button for Map */}
        <button
          onClick={handleRefresh}
          className="absolute top-4 right-4 z-[400] p-2.5 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-xl shadow-lg border border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--accent))] hover:text-purple-500 transition-all hover:scale-105 active:scale-95 group/btn"
          title="Force refresh ISS location"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-purple-500' : 'text-[hsl(var(--foreground))] group-hover/btn:text-purple-500'}`} />
        </button>

        {position ? (
          <MapContainer center={[position.lat, position.lon]} zoom={4} zoomControl={false} className="h-full w-full z-0">
            {/* Custom Premium Map Tiles (CartoDB Positron for light, Dark Matter for dark) 
                Since we can't easily switch without context, we use standard OSM but with a CSS filter trick in index.css if needed 
            */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              className="map-tiles"
            />
            <ChangeView center={[position.lat, position.lon]} />
            
            {path.length > 0 && (
              <Polyline 
                positions={path.map(p => [p.lat, p.lon])} 
                color="#8b5cf6" 
                weight={3} 
                dashArray="8, 12" 
                opacity={0.8}
              />
            )}

            <Marker position={[position.lat, position.lon]} icon={issIcon}>
              <Tooltip permanent direction="top" offset={[0, -20]} className="font-bold border-none shadow-xl rounded-xl px-3 py-1.5 text-sm">
                ISS Here
              </Tooltip>
            </Marker>
          </MapContainer>
        ) : (
          <div className="flex flex-col h-full items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-xl opacity-30 rounded-full animate-pulse"></div>
              <RefreshCw className="h-10 w-10 animate-spin text-purple-500 relative z-10" />
            </div>
            <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium animate-pulse">Tracking Satellite...</p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        {/* Location Stat */}
        <div className="rounded-2xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:border-[hsl(var(--border))] transition-colors relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <MapPin className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shadow-inner">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--muted-foreground))]">Current Location</h3>
          </div>
          <div className="space-y-1 relative z-10">
            <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-500 tracking-tight">
              {locationName}
            </p>
            {position && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] font-mono font-medium flex items-center gap-2">
                <span>Lat: {position.lat.toFixed(4)}°</span>
                <span className="w-1 h-1 rounded-full bg-[hsl(var(--border))]"></span>
                <span>Lon: {position.lon.toFixed(4)}°</span>
              </p>
            )}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              {path.length} {path.length === 1 ? 'Position' : 'Positions'} Tracked
            </div>
          </div>
        </div>

        {/* Speed Stat */}
        <div className="rounded-2xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:border-[hsl(var(--border))] transition-colors relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Navigation className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500 shadow-inner">
              <Navigation className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-[hsl(var(--muted-foreground))]">Estimated Speed</h3>
          </div>
          <p className="text-4xl font-black relative z-10 tracking-tight">
            {speed > 0 ? speed.toFixed(0) : '---'} 
            <span className="text-lg font-semibold text-[hsl(var(--muted-foreground))] ml-2">km/h</span>
          </p>
          {speed > 0 && (
             <div className="mt-3 h-1.5 w-full bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((speed / 30000) * 100, 100)}%` }}
                ></div>
             </div>
          )}
        </div>

        {/* Astros Stat */}
        <div className="rounded-2xl border border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]/50 backdrop-blur-xl p-6 shadow-xl shadow-black/5 hover:border-[hsl(var(--border))] transition-colors flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-24 h-24" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shadow-inner">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-[hsl(var(--muted-foreground))]">People in Space</h3>
              </div>
              <p className="text-4xl font-black tracking-tight">{astros.number}</p>
            </div>
            
            {astros.people.length > 0 && (
              <div className="flex-1 bg-[hsl(var(--muted))]/50 p-3.5 rounded-xl border border-[hsl(var(--border))]/30 max-h-28 overflow-y-auto custom-scrollbar">
                <ul className="space-y-2">
                  {astros.people.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-medium">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
