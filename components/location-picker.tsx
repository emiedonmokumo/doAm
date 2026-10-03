'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { Loader2, MapPin, Navigation, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type PickedLocation = { latitude: number; longitude: number; city: string; region: string };

type LocationPickerProps = { value: PickedLocation | null; onChange: (location: PickedLocation) => void };

let mapsConfigured = false;

/** Narrow adapter around the Google Maps loader; returns false when no browser key is configured. */
export function ensureMapsConfigured() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return false;
  if (!mapsConfigured) {
    setOptions({ key, v: 'weekly', language: 'en', region: 'NG' });
    mapsConfigured = true;
  }
  return true;
}

function placeParts(result: google.maps.GeocoderResult | undefined) {
  const components = result?.address_components ?? [];
  const part = (type: string) => components.find((item) => item.types.includes(type))?.long_name;
  return {
    city: part('locality') ?? part('administrative_area_level_2') ?? part('administrative_area_level_1') ?? 'Selected area',
    region: part('administrative_area_level_1') ?? part('country') ?? 'Nigeria',
  };
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const map = useRef<google.maps.Map | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [message, setMessage] = useState('Loading map…');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!ensureMapsConfigured()) {
      setStatus('unavailable');
      setMessage('Map is unavailable until NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured. You can still use your current location.');
      return;
    }
    let active = true;
    async function load() {
      try {
        const [{ Map }, { Geocoder }] = await Promise.all([
          importLibrary('maps'), importLibrary('geocoding'),
        ]);
        if (!active || !mapElement.current) return;
        const initial = value ? { lat: value.latitude, lng: value.longitude } : { lat: 9.082, lng: 8.6753 };
        const instance = new Map(mapElement.current, { center: initial, zoom: value ? 15 : 6, streetViewControl: false, mapTypeControl: false, fullscreenControl: false, gestureHandling: 'greedy', clickableIcons: false });
        map.current = instance;
        marker.current = new google.maps.Marker({ map: instance, position: value ? initial : undefined, draggable: true });
        marker.current.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          const coordinates = event.latLng?.toJSON();
          if (coordinates) void select(coordinates.lat, coordinates.lng, false);
        });
        geocoder.current = new Geocoder();
        instance.addListener('click', (event: google.maps.MapMouseEvent) => {
          const coordinates = event.latLng?.toJSON();
          if (coordinates) void select(coordinates.lat, coordinates.lng, false);
        });
        setStatus('ready');
        setMessage('Search, tap the map, or drag the pin to your area. Your exact point is never shown publicly.');
      } catch {
        if (active) {
          setStatus('unavailable');
          setMessage('Unable to load the map. Check the Google Maps key and browser connection, or use your current location.');
        }
      }
    }
    void load();
    return () => { active = false; };
  // The loader must run once; a selected map location is updated by select().
  }, []);

  async function select(latitude: number, longitude: number, recenter = true) {
    marker.current?.setPosition({ lat: latitude, lng: longitude });
    if (recenter) {
      map.current?.panTo({ lat: latitude, lng: longitude });
      if ((map.current?.getZoom() ?? 0) < 14) map.current?.setZoom(15);
    }
    let city = 'Selected area';
    let region = 'Nigeria';
    try {
      const response = await geocoder.current?.geocode({ location: { lat: latitude, lng: longitude } });
      ({ city, region } = placeParts(response?.results[0]));
    } catch {
      // Coordinates remain valid when reverse geocoding is unavailable.
    }
    onChange({ latitude, longitude, city, region });
  }

  async function search() {
    const text = query.trim();
    if (!text || !geocoder.current) return;
    setSearching(true);
    try {
      const response = await geocoder.current.geocode({ address: text, componentRestrictions: { country: 'NG' } });
      const result = response.results[0];
      const coordinates = result?.geometry.location.toJSON();
      if (!result || !coordinates) throw new Error('No result');
      marker.current?.setPosition(coordinates);
      map.current?.panTo(coordinates);
      map.current?.setZoom(16);
      onChange({ latitude: coordinates.lat, longitude: coordinates.lng, ...placeParts(result) });
      setMessage('Drag the pin or tap the map to fine-tune your area.');
    } catch {
      setMessage('No matching place found. Try a nearby landmark, street, or area name.');
    } finally {
      setSearching(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setMessage('Your browser does not support location access. Choose a point on the map instead.'); return; }
    setLocating(true);
    setMessage('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        setMessage('Drag the pin or tap the map to fine-tune your area.');
        void select(position.coords.latitude, position.coords.longitude);
      },
      () => { setLocating(false); setMessage('Location access was unavailable. Search or choose a point on the map instead.'); },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="space-y-3">
      {status !== 'unavailable' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89958f]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }}
              placeholder="Search a street, area, or landmark"
              aria-label="Search for a location"
              disabled={status !== 'ready'}
              className="h-11 w-full rounded-xl border border-[#e2e9e5] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#0e6b53] focus:ring-2 focus:ring-[#0e6b53]/10 disabled:opacity-60"
            />
          </div>
          <button type="button" onClick={() => void search()} disabled={status !== 'ready' || searching || !query.trim()} className="flex h-11 shrink-0 items-center rounded-xl bg-[#0e6b53] px-4 text-sm font-semibold text-white transition hover:bg-[#095640] disabled:opacity-50">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </div>
      )}
      <div ref={mapElement} className="h-72 overflow-hidden rounded-xl border border-[#e2e9e5] bg-[#edf7f2]" aria-label="Location picker map" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex max-w-md items-center gap-2 text-xs leading-5 text-[#6b7280]" role="status">
          {status === 'loading' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}{message}
        </p>
        <button type="button" onClick={useCurrentLocation} disabled={locating} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0e6b53] px-3 py-2 text-xs font-semibold text-[#0e6b53] transition hover:bg-[#edf7f2] disabled:opacity-60">
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}Use my location
        </button>
      </div>
      {value && <div className="flex items-center gap-2 rounded-lg bg-[#edf7f2] px-3 py-2 text-sm text-[#0e6b53]"><MapPin className="h-4 w-4" />Selected area: {value.city}, {value.region}</div>}
    </div>
  );
}
