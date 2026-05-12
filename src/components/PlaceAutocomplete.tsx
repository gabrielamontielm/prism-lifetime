import React, { useRef, useEffect, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from './ui/Input';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  } | null) => void;
  defaultValue?: string;
}

export function PlaceAutocomplete({ onPlaceSelect, defaultValue = '' }: PlaceAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  const hasValidMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== '';
  
  const placesLib = hasValidMapsKey ? useMapsLibrary('places') : null;
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!placesLib) return;
    autocompleteService.current = new placesLib.AutocompleteService();
    // PlacesService needs a dummy element if we don't have a map yet, or we can just use the library
    placesService.current = new placesLib.PlacesService(document.createElement('div'));
    sessionToken.current = new placesLib.AutocompleteSessionToken();
  }, [placesLib]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (!value) {
      setPredictions([]);
      setShowPredictions(false);
      onPlaceSelect(null);
      return;
    }

    if (!autocompleteService.current) return;

    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      { 
        input: value,
        sessionToken: sessionToken.current || undefined
      },
      (results, status) => {
        setLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  };

  const selectPlace = (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description);
    setShowPredictions(false);
    
    if (!placesService.current || !placesLib) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'place_id'],
        sessionToken: sessionToken.current || undefined
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
          onPlaceSelect({
            address: place.formatted_address || prediction.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id || prediction.place_id
          });
          // Refresh session token for next search
          sessionToken.current = new placesLib.AutocompleteSessionToken();
        }
      }
    );
  };

  if (!hasValidMapsKey) {
    return (
      <div className="relative">
        <Input
          label="Location"
          placeholder="e.g., Uhuru Peak, Tanzania (Maps not configured)"
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            onPlaceSelect(val ? { address: val, lat: 0, lng: 0, placeId: '' } : null);
          }}
        />
        <div className="absolute right-4 bottom-3 text-prism-400">
          <MapPin size={18} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          label="Location"
          placeholder="e.g., Uhuru Peak, Tanzania"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
          onFocus={() => inputValue && setShowPredictions(true)}
        />
        <div className="absolute right-4 bottom-3 text-prism-400">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
        </div>
      </div>

      {showPredictions && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-prism-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto translate-y-[-8px]">
          {predictions.map(p => (
            <button
              key={p.place_id}
              onClick={() => selectPlace(p)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-prism-50 transition-colors border-b border-prism-50 last:border-0"
            >
              <MapPin size={16} className="text-accent-blue mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-prism-800 line-clamp-1">{p.structured_formatting.main_text}</p>
                <p className="text-xs text-prism-500 line-clamp-1">{p.structured_formatting.secondary_text}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
