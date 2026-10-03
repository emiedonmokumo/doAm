'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LocationPicker, type PickedLocation } from '@/components/location-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, AlertCircle } from 'lucide-react';

type Category = 'PICKUP_DELIVERY' | 'QUEUEING' | 'FAVOR' | 'QUICK_REPAIR';
const categories: { value: Category; label: string }[] = [
  { value: 'PICKUP_DELIVERY', label: 'Pickup and Delivery' }, { value: 'QUEUEING', label: 'Queueing' },
  { value: 'FAVOR', label: 'Favor' }, { value: 'QUICK_REPAIR', label: 'Quick Repair' },
];

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function NewTaskPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category>('PICKUP_DELIVERY');
  const [pickup, setPickup] = useState<PickedLocation | null>(null);
  const [dropoff, setDropoff] = useState<PickedLocation | null>(null);
  const [pin, setPin] = useState('');
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const validNewFiles: File[] = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed.');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`"${file.name}" is larger than 5 MB.`);
        return;
      }
      validNewFiles.push(file);
    }

    const combined = [...images, ...validNewFiles].slice(0, MAX_IMAGES);
    if (images.length + validNewFiles.length > MAX_IMAGES) {
      setError(`You can attach a maximum of ${MAX_IMAGES} photos.`);
    } else {
      setError('');
    }

    setImages(combined);
    setImagePreviews(combined.map((f) => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    setImagePreviews(updated.map((f) => URL.createObjectURL(f)));
  }

  async function submit(form: FormData) {
    if (!pickup || (category === 'PICKUP_DELIVERY' && !dropoff)) { setError('Choose the required task locations.'); return; }
    setLoading(true); setError('');
    try {
      const taskData = {
        title: form.get('title'),
        description: form.get('description') || undefined,
        category,
        runnerFee: form.get('runnerFee'),
        estimatedExpenses: form.get('estimatedExpenses'),
        settlementMethod: form.get('settlementMethod'),
        pickup: { ...pickup, approximateArea: form.get('pickupArea') || `${pickup.city}, ${pickup.region}` },
        ...(category === 'PICKUP_DELIVERY' && dropoff ? { dropoff: { ...dropoff, approximateArea: form.get('dropoffArea') || `${dropoff.city}, ${dropoff.region}` } } : {}),
      };

      const payload = new FormData();
      payload.set('data', JSON.stringify(taskData));
      for (const image of images) {
        payload.append('images', image);
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        body: payload,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? 'Unable to post this task.');
      setTaskId(body.task.id); setPin(body.handshake_pin);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to post this task.'); }
    finally { setLoading(false); }
  }

  if (pin) return <section className="mx-auto max-w-lg space-y-5 rounded-2xl border border-[#dce8e1] bg-white p-6">
    <p className="text-xs font-bold uppercase tracking-wider text-[#0e6b53]">Task posted</p><h1 className="text-2xl font-bold text-[#16241d]">Your handover PIN</h1>
    <p className="text-sm text-[#68766e]">Give this PIN to your runner in person after the task is done. It is shown once and is required to confirm completion.</p>
    <div className="rounded-xl bg-[#edf7f2] py-5 text-center font-mono text-4xl font-bold tracking-[0.35em] text-[#0e6b53]" aria-label={`Handover PIN ${pin}`}>{pin}</div>
    <Button className="h-12 w-full bg-[#0e6b53]" onClick={() => router.push(`/tasks/${taskId}`)}>Open task</Button>
  </section>;

  return <form action={submit} className="mx-auto max-w-2xl space-y-6 pb-8">
    <header><p className="text-xs font-bold uppercase tracking-wider text-[#0e6b53]">Create opportunity</p><h1 className="mt-2 text-2xl font-bold text-[#16241d]">Post a task for someone nearby</h1><p className="mt-1 text-sm text-[#68766e]">Share the runner fee and any expected expenses separately.</p></header>
    <div className="space-y-2"><Label htmlFor="title">Task title</Label><Input id="title" name="title" required minLength={3} maxLength={120} placeholder="e.g. Pick up a parcel from the post office" /></div>
    <div className="space-y-2"><Label htmlFor="description">Details (optional)</Label><Textarea id="description" name="description" maxLength={2000} /></div>

    {/* Photos attachment section */}
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="photos-input">Photos (optional)</Label>
        <span className="text-xs text-[#68766e]">{images.length}/{MAX_IMAGES} attached</span>
      </div>
      <p className="text-xs text-[#68766e]">Attach photos to clarify what needs to be picked up, bought, or repaired.</p>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {imagePreviews.map((src, index) => (
          <div key={src} className="group relative aspect-square overflow-hidden rounded-xl border border-[#dce5df] bg-[#f8faf9]">
            <img src={src} alt={`Attachment ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black"
              aria-label={`Remove photo ${index + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#dce5df] bg-[#f8faf9] text-[#68766e] transition hover:border-[#0e6b53] hover:bg-[#edf7f2] hover:text-[#0e6b53]"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs font-semibold">Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        id="photos-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFilesSelected}
        className="hidden"
      />
    </div>

    <div className="space-y-2"><Label htmlFor="category">Task type</Label><select id="category" value={category} onChange={(event) => setCategory(event.target.value as Category)} className="h-12 w-full rounded-xl border border-[#e2e9e5] bg-white px-3">{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="runnerFee">Runner fee (₦)</Label><Input id="runnerFee" name="runnerFee" type="number" min="0.01" step="0.01" required /></div><div className="space-y-2"><Label htmlFor="estimatedExpenses">Estimated expenses (₦)</Label><Input id="estimatedExpenses" name="estimatedExpenses" type="number" min="0" step="0.01" required /></div></div>
    <div className="space-y-2"><Label htmlFor="settlementMethod">Handover instruction</Label><select id="settlementMethod" name="settlementMethod" className="h-12 w-full rounded-xl border border-[#e2e9e5] bg-white px-3"><option value="CASH_ON_DELIVERY">Cash on Delivery</option><option value="DIRECT_TRANSFER">Direct Transfer</option></select><p className="text-xs text-[#68766e]">This records how you plan to settle. DoAm does not move or hold money.</p></div>
    <section className="space-y-3"><h2 className="font-semibold">Pickup point</h2><LocationPicker value={pickup} onChange={setPickup} /><Input name="pickupArea" aria-label="Approximate pickup area" placeholder="Approximate area (e.g. Near Kpansia)" /></section>
    {category === 'PICKUP_DELIVERY' && <section className="space-y-3"><h2 className="font-semibold">Drop-off point</h2><LocationPicker value={dropoff} onChange={setDropoff} /><Input name="dropoffArea" aria-label="Approximate drop-off area" placeholder="Approximate area" /></section>}
    {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
    <Button disabled={loading} className="h-12 w-full bg-[#0e6b53]">{loading ? 'Posting…' : 'Post task'}</Button>
  </form>;
}

