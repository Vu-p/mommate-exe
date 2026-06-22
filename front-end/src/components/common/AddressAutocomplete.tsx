import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import './AddressAutocomplete.css';

interface LocationResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ 
  value, 
  onChange, 
  placeholder = "Nhập địa chỉ của bạn...",
  className = "" 
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (searchText: string) => {
    if (!searchText || searchText.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Nominatim OSM API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&addressdetails=1&countrycodes=vn&limit=5`
      );
      const data = await response.json();
      setResults(data);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching address:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== value) {
        searchAddress(query);
      }
    }, 500); // Debounce 500ms
    return () => clearTimeout(timeoutId);
  }, [query, value]);

  const handleSelect = (result: LocationResult) => {
    const newAddress = result.display_name;
    setQuery(newAddress);
    setIsOpen(false);
    onChange(newAddress, { lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value); // Keep passing the raw value up in case they don't select from list
  };

  return (
    <div className={`address-autocomplete ${className}`} ref={wrapperRef}>
      <div className="input-container">
        <MapPin className="input-icon" size={20} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && <div className="loading-spinner"></div>}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="suggestions-list">
          {results.map((result) => (
            <li key={result.place_id} onClick={() => handleSelect(result)}>
              <Search size={16} className="suggestion-icon" />
              <span>{result.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
