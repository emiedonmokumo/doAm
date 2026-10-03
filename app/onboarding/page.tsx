'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin } from 'lucide-react';
import { isProfileComplete } from '@/lib/profile';
import { LocationPicker, type PickedLocation } from '@/components/location-picker';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
    if (profile && isProfileComplete(profile)) {
      router.replace('/tasks/radar');
    }
  }, [loading, user, profile, router]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');

    if (!location) {
      setError('Please select your location to continue.');
      setSaving(false);
      return;
    }
    const { latitude: lat, longitude: lng, city, region: state } = location;


    const response=await fetch('/api/onboarding',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({bio,phone,skills:skills?skills.split(',').map((s)=>s.trim()):[],availability,latitude:lat,longitude:lng,city,region:state,approximateAddress:customAddress||undefined})});
    if (!response.ok) {
      const body=await response.json().catch(()=>null);
      setError(body?.error?.message ?? 'Unable to save your profile.');
      setSaving(false);
      return;
    }

    await refreshProfile();
    router.replace('/tasks/radar');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0e6b53]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] px-5 py-8">
      <div className="mx-auto max-w-[480px]">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-[#0e6b53]' : 'bg-[#dce5e0]'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#111827]">Tell us about yourself</h1>
              <p className="mt-1.5 text-sm text-[#6b7280]">Help others get to know you in the community.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio <span className="text-[#a1aba5] font-normal">(optional)</span></Label>
                <Textarea
                  id="bio"
                  placeholder="A short intro about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[80px] rounded-xl border-[#e2e9e5] bg-white focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number <span className="text-[#a1aba5] font-normal">(optional)</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-xl border-[#e2e9e5] bg-white focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills / interests <span className="text-[#a1aba5] font-normal">(comma-separated)</span></Label>
                <Input
                  id="skills"
                  placeholder="e.g. moving, cleaning, cooking"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="h-12 rounded-xl border-[#e2e9e5] bg-white focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availability">When are you usually available? <span className="text-[#a1aba5] font-normal">(optional)</span></Label>
                <Input
                  id="availability"
                  placeholder="e.g. Weekday evenings, Weekends"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="h-12 rounded-xl border-[#e2e9e5] bg-white focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(1)}
              className="h-12 w-full rounded-xl bg-[#0e6b53] text-base font-semibold hover:bg-[#095640]"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#111827]">Where are you?</h1>
              <p className="mt-1.5 text-sm text-[#6b7280]">
                We use your location to show you nearby opportunities. We never share your exact address.
              </p>
            </div>

            <LocationPicker value={location} onChange={(picked) => { setLocation(picked); setError(''); }} />

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(0)}
                variant="outline"
                className="h-12 flex-1 rounded-xl border-[#e2e9e5]"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!location}
                className="h-12 flex-1 rounded-xl bg-[#0e6b53] font-semibold hover:bg-[#095640]"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#111827]">Almost there</h1>
              <p className="mt-1.5 text-sm text-[#6b7280]">Add a landmark or directions to help nearby people find your area.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Landmark or extra directions <span className="text-[#a1aba5] font-normal">(optional)</span></Label>
              <Input
                id="address"
                maxLength={160}
                placeholder="e.g. Behind Total filling station, Kpansia"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="h-12 rounded-xl border-[#e2e9e5] bg-white focus:border-[#0e6b53] focus:ring-[#0e6b53]/10"
              />
              <p className="text-xs text-[#89958f]">
                This is shown as an approximate area — never your exact home address.
              </p>
            </div>

            <div className="rounded-xl bg-[#edf7f2] p-4">
              <div className="flex items-center gap-2 text-sm text-[#0e6b53]">
                <MapPin className="h-4 w-4" />
                <span className="font-semibold">
                  {location ? `${location.city}, ${location.region}` : 'Choose your location'}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="h-12 flex-1 rounded-xl border-[#e2e9e5]"
              >
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="h-12 flex-1 rounded-xl bg-[#0e6b53] font-semibold hover:bg-[#095640]"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Finish'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
