'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type PickedLocation = { latitude: number; longitude: number; city: string; region: string };

type LocationPickerProps = { value: PickedLocation | null; onChange: (location: PickedLocation) => void };

let mapsConfigured = false;

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

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setStatus('unavailable');
      setMessage('Map is unavailable until NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured. You can still use your current location.');
      return;
    }
    let active = true;
    async function load() {
      try {
        if (!mapsConfigured) {
          setOptions({ key, v: 'weekly', language: 'en', region: 'NG' });
          mapsConfigured = true;
        }
        const [{ Map }, { Geocoder }] = await Promise.all([
          importLibrary('maps'), importLibrary('geocoding'),
        ]);
        if (!active || !mapElement.current) return;
        const initial = value ? { lat: value.latitude, lng: value.longitude } : { lat: 9.082, lng: 8.6753 };
        const instance = new Map(mapElement.current, { center: initial, zoom: value ? 14 : 6, streetViewControl: false, mapTypeControl: false, fullscreenControl: false });
        map.current = instance;
        marker.current = new google.maps.Marker({ map: instance, position: value ? initial : undefined });
        geocoder.current = new Geocoder();
        instance.addListener('click', (event: google.maps.MapMouseEvent) => {
          const coordinates = event.latLng?.toJSON();
          if (coordinates) void select(coordinates.lat, coordinates.lng);
        });
        setStatus('ready');
        setMessage('Move the map and tap the precise meeting area. Your exact coordinate is never shown publicly.');
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

  async function select(latitude: number, longitude: number) {
    marker.current?.setPosition({ lat: latitude, lng: longitude });
    map.current?.panTo({ lat: latitude, lng: longitude });
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

  function useCurrentLocation() {
    if (!navigator.geolocation) { setMessage('Your browser does not support location access. Choose a point on the map instead.'); return; }
    setMessage('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => void select(position.coords.latitude, position.coords.longitude),
      () => setMessage('Location access was unavailable. Choose a point on the map instead.'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return <div className="space-y-3"><div ref={mapElement} className="h-72 overflow-hidden rounded-xl border border-[#e2e9e5] bg-[#edf7f2]" aria-label="Location picker map" />{status === 'loading' && <p className="flex items-center gap-2 text-sm text-[#6b7280]"><Loader2 className="h-4 w-4 animate-spin" />{message}</p>}<div className="flex flex-wrap items-center justify-between gap-2"><p className="max-w-md text-xs leading-5 text-[#6b7280]">{message}</p><button type="button" onClick={useCurrentLocation} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0e6b53] px-3 py-2 text-xs font-semibold text-[#0e6b53]"><Navigation className="h-3.5 w-3.5" />Use my location</button></div>{value && <div className="flex items-center gap-2 rounded-lg bg-[#edf7f2] px-3 py-2 text-sm text-[#0e6b53]"><MapPin className="h-4 w-4" />Selected area: {value.city}, {value.region}</div>}</div>;
}
