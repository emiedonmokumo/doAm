'use client';

import Link from 'next/link';
import { importLibrary } from '@googlemaps/js-api-loader';
import { Loader2, MapPin, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ensureMapsConfigured } from '@/components/location-picker';

export type FeedMapTask = { id: string; title: string; category: string; runnerFee: number; pickupArea: string; distanceKm: number; approximateLatitude: number; approximateLongitude: number };
export type FeedMapPoint = { latitude: number; longitude: number };

type FeedMapProps = {
  center: FeedMapPoint | null;
  tasks: FeedMapTask[];
  nearbyUsers: FeedMapPoint[];
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
  className?: string;
};

const BRAND = '#0e6b53';
const YOU = '#2563eb';
const NEIGHBOUR = '#f59e0b';
const shortMoney = (value: number) => (value >= 1000 ? `₦${Math.round(value / 100) / 10}k` : `₦${value}`);
const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

/** Muted, slightly darkened base map so DoAm markers stand out from Google's own features. */
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ saturation: -55 }, { lightness: -12 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f3f4f6' }, { weight: 2 }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#b9c4bd' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#94a3b8' }] },
];

function taskIcon(selected: boolean): google.maps.Symbol {
  return {
    path: 'M0-30c-8.3 0-15 6.5-15 14.6C-15-4.6 0 0 0 0s15-4.6 15-15.4C15-23.5 8.3-30 0-30z',
    fillColor: selected ? '#e8704a' : BRAND,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2.5,
    scale: selected ? 1.35 : 1.1,
    labelOrigin: new google.maps.Point(0, -16),
  };
}

export function FeedMap({ center, tasks, nearbyUsers, selectedTaskId, onSelectTask, className }: FeedMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const overlays = useRef<{ tasks: Map<string, google.maps.Marker>; others: (google.maps.Marker | google.maps.Circle)[] }>({ tasks: new Map(), others: [] });
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const selectRef = useRef(onSelectTask);
  useEffect(() => { selectRef.current = onSelectTask; }, [onSelectTask]);

  useEffect(() => {
    if (!ensureMapsConfigured()) { setStatus('unavailable'); return; }
    let active = true;
    importLibrary('maps').then(({ Map: GoogleMap }) => {
      if (!active || !mapElement.current) return;
      map.current = new GoogleMap(mapElement.current, {
        center: { lat: 9.082, lng: 8.6753 }, zoom: 6,
        streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false,
        gestureHandling: 'cooperative', styles: MAP_STYLES,
      });
      map.current.addListener('click', () => selectRef.current(null));
      setStatus('ready');
    }).catch(() => { if (active) setStatus('unavailable'); });
    return () => { active = false; };
  }, []);

  // Rebuild overlays whenever the data changes.
  useEffect(() => {
    const instance = map.current;
    if (status !== 'ready' || !instance) return;
    const current = overlays.current;
    current.tasks.forEach((marker) => marker.setMap(null));
    current.others.forEach((overlay) => overlay.setMap(null));
    current.tasks.clear();
    current.others = [];

    const bounds = new google.maps.LatLngBounds();
    if (center) {
      const position = { lat: center.latitude, lng: center.longitude };
      bounds.extend(position);
      current.others.push(new google.maps.Circle({ map: instance, center: position, radius: 10_000, strokeColor: BRAND, strokeOpacity: 0.6, strokeWeight: 2, fillColor: BRAND, fillOpacity: 0.06, clickable: false }));
      // Soft halo + solid dot gives the "You" marker a beacon look.
      current.others.push(new google.maps.Marker({ map: instance, position, zIndex: 999, clickable: false, icon: { path: google.maps.SymbolPath.CIRCLE, scale: 20, fillColor: YOU, fillOpacity: 0.22, strokeColor: YOU, strokeOpacity: 0.5, strokeWeight: 1 } }));
      current.others.push(new google.maps.Marker({ map: instance, position, zIndex: 1000, title: 'You', icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: YOU, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3.5 } }));
    }
    nearbyUsers.forEach((user) => {
      current.others.push(new google.maps.Marker({ map: instance, position: { lat: user.latitude, lng: user.longitude }, clickable: false, zIndex: 1, title: 'Community member nearby', icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: NEIGHBOUR, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2.5 } }));
    });
    tasks.forEach((task) => {
      const position = { lat: task.approximateLatitude, lng: task.approximateLongitude };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map: instance, position, title: task.title, zIndex: 10, icon: taskIcon(false),
        label: { text: shortMoney(task.runnerFee), color: '#ffffff', fontSize: '10px', fontWeight: '800' },
      });
      marker.addListener('click', () => selectRef.current(task.id));
      current.tasks.set(task.id, marker);
    });

    if (tasks.length && center) instance.fitBounds(bounds, 48);
    else if (center) { instance.setCenter({ lat: center.latitude, lng: center.longitude }); instance.setZoom(13); }
  }, [status, center, tasks, nearbyUsers]);

  // Highlight the selected task without rebuilding every marker.
  useEffect(() => {
    overlays.current.tasks.forEach((marker, id) => {
      const selected = id === selectedTaskId;
      marker.setIcon(taskIcon(selected));
      marker.setZIndex(selected ? 500 : 10);
      if (selected) map.current?.panTo(marker.getPosition()!);
    });
  }, [selectedTaskId, status, tasks]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[#e2e9e5] bg-[#edf7f2] ${className ?? ''}`}>
      <div ref={mapElement} className="h-full w-full" aria-label="Map of nearby tasks and community members" />
      {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-[#68766e]"><Loader2 className="h-4 w-4 animate-spin" />Loading map…</div>}
      {status === 'unavailable' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[#68766e]"><MapPin className="h-6 w-6 text-[#0e6b53]" />The map is unavailable right now. Nearby tasks are still listed below.</div>}
      {status === 'ready' && (
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 text-[11px] font-semibold text-white">
          <span className="flex items-center gap-1.5 rounded-full bg-[#16241d]/85 px-2.5 py-1 shadow-md ring-1 ring-white/10 backdrop-blur"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb] ring-2 ring-white" />You</span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#16241d]/85 px-2.5 py-1 shadow-md ring-1 ring-white/10 backdrop-blur"><span className="h-2.5 w-2.5 rounded-full bg-[#0e6b53] ring-2 ring-white" />Tasks · {tasks.length}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#16241d]/85 px-2.5 py-1 shadow-md ring-1 ring-white/10 backdrop-blur"><span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b] ring-2 ring-white" />Neighbours · {nearbyUsers.length}</span>
        </div>
      )}
      {selectedTask && (
        <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-[#e2e9e5] bg-white p-4 shadow-[0_12px_32px_rgba(17,24,39,0.16)]">
          <button type="button" onClick={() => onSelectTask(null)} aria-label="Close task preview" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-[#89958f] hover:bg-[#f3f6f4]"><X className="h-4 w-4" /></button>
          <span className="text-xs font-semibold text-[#0e6b53]">{selectedTask.category.replaceAll('_', ' ')}</span>
          <p className="mt-0.5 pr-8 font-bold text-[#16241d]">{selectedTask.title}</p>
          <p className="mt-0.5 text-xs text-[#68766e]">{selectedTask.pickupArea} · {selectedTask.distanceKm} km away</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <strong className="text-sm text-[#16241d]">{money(selectedTask.runnerFee)}</strong>
            <Link href={`/tasks/${selectedTask.id}`} className="rounded-lg bg-[#0e6b53] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#095640]">View task</Link>
          </div>
        </div>
      )}
    </div>
  );
}
