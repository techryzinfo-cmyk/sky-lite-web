'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X, Navigation, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet's default icon paths for Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerMapProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const LocateControl = ({ setPosition }: { setPosition: (p: L.LatLng) => void }) => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
  };

  useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      setIsLocating(false);
    },
    locationerror(e) {
      alert("Unable to fetch location: " + e.message);
      setIsLocating(false);
    },
    click(e) {
      setPosition(e.latlng);
    },
  });

  return (
    <div className="absolute top-4 right-4 z-[400]">
      <button
        type="button"
        onClick={handleLocate}
        disabled={isLocating}
        className="flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        title="My Location"
      >
        {isLocating ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Navigation className="w-5 h-5 text-blue-600" />}
      </button>
    </div>
  );
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  isOpen, onClose, onSelectLocation, initialLat, initialLng
}) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition(new L.LatLng(initialLat, initialLng));
    }
  }, [initialLat, initialLng, isOpen]);

  const defaultCenter: [number, number] = initialLat && initialLng 
    ? [initialLat, initialLng] 
    : [25.2048, 55.2708]; // Default to Dubai

  const handleConfirm = () => {
    if (position) {
      onSelectLocation(position.lat, position.lng);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl relative z-10 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[80vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-black text-gray-900">Pinpoint Location</h3>
              <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-gray-900 bg-gray-50 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 relative">
              <MapContainer 
                center={defaultCenter} 
                zoom={13} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocateControl setPosition={setPosition} />
                {position && <Marker position={position} />}
              </MapContainer>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                {position ? (
                  <>
                    <p className="text-xs font-bold text-slate-500">Selected Coordinates</p>
                    <p className="text-sm font-semibold text-blue-600">{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-slate-500">Click on the map to drop a pin</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!position}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-600/20"
              >
                Confirm Location
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LocationPickerMap;
