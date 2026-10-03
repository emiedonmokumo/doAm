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
const shortMoney = (value: number) => (value >= 1000 ? `₦${Math.round(value / 100) / 10}k` : `₦${value}`);
const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

function taskIcon(selected: boolean): google.maps.Symbol {
  return {
    path: 'M0-30c-8.3 0-15 6.5-15 14.6C-15-4.6 0 0 0 0s15-4.6 15-15.4C15-23.5 8.3-30 0-30z',
    fillColor: selected ? '#e8704a' : BRAND,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: selected ? 1.25 : 1,
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
        gestureHandling: 'cooperative',
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
      current.others.push(new google.maps.Circle({ map: instance, center: position, radius: 10_000, strokeColor: BRAND, strokeOpacity: 0.25, strokeWeight: 1, fillColor: BRAND, fillOpacity: 0.04, clickable: false }));
      current.others.push(new google.maps.Marker({ map: instance, position, zIndex: 1000, title: 'You', icon: { path: google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 } }));
    }
    nearbyUsers.forEach((user) => {
      current.others.push(new google.maps.Marker({ map: instance, position: { lat: user.latitude, lng: user.longitude }, clickable: false, zIndex: 1, title: 'Community member nearby', icon: { path: google.maps.SymbolPath.CIRCLE, scale: 5, fillColor: '#7fbfa9', fillOpacity: 0.85, strokeColor: '#ffffff', strokeWeight: 1.5 } }));
    });
    tasks.forEach((task) => {
      const position = { lat: task.approximateLatitude, lng: task.approximateLongitude };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map: instance, position, title: task.title, zIndex: 10, icon: taskIcon(false),
        label: { text: shortMoney(task.runnerFee), color: '#ffffff', fontSize: '9px', fontWeight: '700' },
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
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#27352e]">
          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm"><span className="h-2.5 w-2.5 rounded-full bg-[#2563eb] ring-2 ring-white" />You</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm"><span className="h-2.5 w-2.5 rounded-full bg-[#0e6b53]" />Tasks · {tasks.length}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm"><span className="h-2 w-2 rounded-full bg-[#7fbfa9]" />Neighbours · {nearbyUsers.length}</span>
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
