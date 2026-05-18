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
  const [predictions, setPredictions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  const hasValidMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== '';
  
  const placesLib = hasValidMapsKey ? useMapsLibrary('places') : null;
  
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!placesLib) return;
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

    if (!placesLib) return;

    setLoading(true);
    try {
      const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        sessionToken: sessionToken.current || undefined
      });
      
      setPredictions(suggestions || []);
      setShowPredictions(true);
    } catch (error) {
      console.error('Autocomplete fetch failed:', error);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setLoading(false);
    }
  };

  const selectPlace = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    setInputValue(prediction.text.toString());
    setShowPredictions(false);
    
    if (!placesLib) return;

    try {
      const place = new placesLib.Place({ id: prediction.placeId });
      
      // Use fetchFields (New API) instead of PlacesService.getDetails (Legacy)
      await place.fetchFields({
        fields: ['formattedAddress', 'location', 'id']
      });

      if (place.location) {
        onPlaceSelect({
          address: place.formattedAddress || prediction.text.toString(),
          lat: place.location.lat(),
          lng: place.location.lng(),
          placeId: place.id || prediction.placeId
        });
        // Refresh session token for next search
        sessionToken.current = new placesLib.AutocompleteSessionToken();
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback if detail fetch fails
      onPlaceSelect({
        address: prediction.text.toString(),
        lat: 0,
        lng: 0,
        placeId: prediction.placeId
      });
    }
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
          {predictions.map((suggestion, index) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return null;
            
            return (
              <button
                key={prediction.placeId || index}
                onClick={() => selectPlace(suggestion)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-prism-50 transition-colors border-b border-prism-50 last:border-0"
              >
                <MapPin size={16} className="text-accent-blue mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-prism-800 line-clamp-1">{prediction.mainText.toString()}</p>
                  <p className="text-xs text-prism-500 line-clamp-1">{prediction.secondaryText.toString()}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
