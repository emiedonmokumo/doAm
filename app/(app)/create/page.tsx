'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DOAM_CATEGORIES, type DoAmStatus } from '@/lib/doam';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker, type PickedLocation } from '@/components/location-picker';
import { Loader2, CalendarDays, Clock3, Repeat, Zap } from 'lucide-react';
import { time } from 'console';

const RECURRENCE_OPTIONS = ['None', 'Daily', 'Weekly', 'Mon-Fri', 'Weekends'];

export default function CreateDoAmPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [category, setCategory] = useState('Other');
  const [locationLabel, setLocationLabel] = useState('');
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurring, setRecurring] = useState('None');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [isMultiPerson, setIsMultiPerson] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(status: DoAmStatus) {
    if (!user) return;
    setError('');

    if (!title.trim()) {
      setError('Please give your DoAm a title.');
      return;
    }
    if (!reward || isNaN(Number(reward)) || Number(reward) <= 0) {
      setError('Please set a valid reward amount.');
      return;
    }

    if (!location) {
      setError('Choose a location on the map or use your current location.');
      return;
    }
    setLoading(true);
    // const timer = new Date(`${scheduledDate}T${scheduledTime || '00:00'}`).toISOString()
    console.log(scheduledTime)
    // console.log(timer)
    const response = await fetch('/api/doams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || undefined,
        reward,
        category,
        status,
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        region: location.region,
        approximateAddress: locationLabel || undefined,
        instructions: additionalInstructions || undefined,
        scheduledAt: scheduledDate
          ? new Date(`${scheduledDate}T${scheduledTime || '00:00'}`).toISOString()
          : undefined,
        recurrence:
          recurring === 'None'
            ? undefined
            : recurring === 'Daily'
              ? 'DAILY'
              : recurring === 'Weekly'
                ? 'WEEKLY'
                : 'SELECTED_DAYS',
        isMultiPerson,
        maxParticipants: isMultiPerson ? maxParticipants : 1,
      }),
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error?.message ?? 'Unable to create your DoAm.');
      setLoading(false);
      return;
    }
    const data = await response.json();
    router.push(status === 'DRAFT' ? '/home' : `/doams/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0e6b53]">
          <Zap className="h-3.5 w-3.5" /> Create opportunity
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#16241d]">
          What do you need done?
        </h1>
        <p className="mt-1.5 text-sm text-[#7b8880]">
          Keep it simple. Someone nearby is ready to help.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">
            Give it a clear title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g. Help move a sofa upstairs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Tell people a little more <span className="text-[#a1aba5] font-normal">(optional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="What should someone know before they say yes?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reward">
              Reward (₦) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reward"
              type="number"
              placeholder="e.g. 3000"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 w-full rounded-xl border border-[#e2e9e5] bg-[#fbfcfb] px-3 text-sm outline-none focus:border-[#0e6b53] focus:ring-4 focus:ring-[#0e6b53]/10"
            >
              {DOAM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Where? <span className="text-red-500">*</span>
          </Label>
          <LocationPicker value={location} onChange={setLocation} />
          <Input
            placeholder="Add an approximate area (e.g. Near Kpansia)"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Date
            </Label>
            <Input
              id="date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" /> Time
            </Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="h-12 rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5" /> Recurring
          </Label>
          <div className="flex flex-wrap gap-2">
            {RECURRENCE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setRecurring(opt)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  recurring === opt
                    ? 'border-[#0e6b53] bg-[#0e6b53] text-white'
                    : 'border-[#e1e8e4] bg-white text-[#6e7c74] hover:border-[#9fcbb9]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">
            Additional instructions <span className="text-[#a1aba5] font-normal">(optional)</span>
          </Label>
          <Textarea
            id="instructions"
            placeholder="Any extra details someone should know..."
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            className="min-h-[80px] rounded-xl border-[#e2e9e5] bg-[#fbfcfb] focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
          />
        </div>

        <div className="rounded-xl border border-[#e2e9e5] bg-white p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isMultiPerson}
              onChange={(e) => setIsMultiPerson(e.target.checked)}
              className="h-5 w-5 rounded accent-[#0e6b53]"
            />
            <div>
              <p className="text-sm font-semibold text-[#27352e]">Allow multiple people</p>
              <p className="text-xs text-[#89958f]">Let more than one person take this DoAm</p>
            </div>
          </label>
          {isMultiPerson && (
            <div className="mt-3">
              <Label htmlFor="maxParticipants">Max participants</Label>
              <Input
                id="maxParticipants"
                type="number"
                min={1}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="mt-1 h-10 rounded-xl border-[#e2e9e5] bg-[#fbfcfb]"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading}
            variant="outline"
            className="h-12 rounded-xl border-[#e2e9e5] px-5"
          >
            Save as draft
          </Button>
          <Button
            onClick={() => handleSubmit('PUBLISHED')}
            disabled={loading}
            className="h-12 rounded-xl bg-[#0e6b53] px-6 font-semibold hover:bg-[#095640]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" /> Post DoAm
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
