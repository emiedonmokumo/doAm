'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, Navigation, Check } from 'lucide-react';
import { isProfileComplete } from '@/lib/profile';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

const NIGERIAN_CITIES = [
  { city: 'Lagos', state: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { city: 'Ikeja', state: 'Lagos', lat: 6.6018, lng: 3.3515 },
  { city: 'Yaba', state: 'Lagos', lat: 6.5059, lng: 3.3699 },
  { city: 'Surulere', state: 'Lagos', lat: 6.4474, lng: 3.3673 },
  { city: 'Lekki', state: 'Lagos', lat: 6.4698, lng: 4.0116 },
  { city: 'Abuja', state: 'FCT', lat: 9.0765, lng: 7.3986 },
  { city: 'Port Harcourt', state: 'Rivers', lat: 4.8156, lng: 7.0498 },
  { city: 'Kano', state: 'Kano', lat: 12.0022, lng: 8.592 },
  { city: 'Ibadan', state: 'Oyo', lat: 7.3775, lng: 3.947 },
  { city: 'Enugu', state: 'Enugu', lat: 6.5244, lng: 7.5219 },
  { city: 'Warri', state: 'Delta', lat: 5.5141, lng: 5.7903 },
  { city: 'Benin City', state: 'Edo', lat: 6.335, lng: 5.6037 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  const [selectedCity, setSelectedCity] = useState<typeof NIGERIAN_CITIES[0] | null>(null);
  const [customLat, setCustomLat] = useState<number | null>(null);
  const [customLng, setCustomLng] = useState<number | null>(null);
  const [detectedArea, setDetectedArea] = useState<{ city: string; state: string } | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/sign-in');
    }
    if (profile && isProfileComplete(profile)) {
      router.replace('/home');
    }
  }, [loading, user, profile, router]);

  function useCurrentLocation() {
    setLocating(true);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please select a city instead.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCustomLat(position.coords.latitude);
        setCustomLng(position.coords.longitude);
        setDetectedArea(null);
        void resolveDetectedArea(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError('Could not get your location. Please select a city instead.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  async function resolveDetectedArea(latitude: number, longitude: number) {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setError('We found your coordinates, but could not identify your city. Please select your city below.');
      setLocating(false);
      return;
    }
    try {
      setOptions({ key, v: 'weekly', language: 'en', region: 'NG' });
      const { Geocoder } = await importLibrary('geocoding');
      const response = await new Geocoder().geocode({ location: { lat: latitude, lng: longitude } });
      const components = response.results[0]?.address_components ?? [];
      const part = (type: string) => components.find((item) => item.types.includes(type))?.long_name;
      const city = part('locality') ?? part('administrative_area_level_2') ?? part('administrative_area_level_1');
      const state = part('administrative_area_level_1') ?? part('country');
      if (!city || !state) throw new Error('Location label unavailable');
      setDetectedArea({ city, state });
      setError('');
    } catch {
      setError('We found your coordinates, but could not identify your city. Please select your city below.');
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');

    const lat = customLat ?? selectedCity?.lat;
    const lng = customLng ?? selectedCity?.lng;
    const city = selectedCity?.city ?? detectedArea?.city;
    const state = selectedCity?.state ?? detectedArea?.state;

    if (lat == null || lng == null || !city || !state) {
      setError('Please select your location to continue.');
      setSaving(false);
      return;
    }

    const response=await fetch('/api/onboarding',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({bio,phone,skills:skills?skills.split(',').map((s)=>s.trim()):[],availability,latitude:lat,longitude:lng,city,region:state,approximateAddress:customAddress||undefined})});
    if (!response.ok) {
      const body=await response.json().catch(()=>null);
      setError(body?.error?.message ?? 'Unable to save your profile.');
      setSaving(false);
      return;
    }

    await refreshProfile();
    router.replace('/home');
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

            <button
              onClick={useCurrentLocation}
              disabled={locating}
              className="flex w-full items-center gap-3 rounded-xl border border-[#0e6b53] bg-[#edf7f2] p-4 text-left transition hover:bg-[#e0f0e8]"
            >
              {locating ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#0e6b53]" />
              ) : (
                <Navigation className="h-6 w-6 text-[#0e6b53]" />
              )}
              <div>
                <p className="font-semibold text-[#0e6b53]">Use my current location</p>
                <p className="text-xs text-[#5a8a7a]">Requires browser permission</p>
              </div>
            </button>

            {customLat != null && customLng != null && (
              <div className="flex items-center gap-2 rounded-lg bg-[#e9f7f0] px-4 py-3 text-sm text-[#0e6b53]">
                <Check className="h-4 w-4" /> {detectedArea ? `Location detected: ${detectedArea.city}, ${detectedArea.state}` : 'Location detected'}
              </div>
            )}

            <div className="relative">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-[#dce5e0]" />
                <span className="text-xs font-medium text-[#89958f]">or select your city</span>
                <div className="h-px flex-1 bg-[#dce5e0]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {NIGERIAN_CITIES.map((city) => (
                <button
                  key={city.city}
                  onClick={() => {
                    setSelectedCity(city);
                    setCustomLat(null);
                    setCustomLng(null);
                    setDetectedArea(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition ${
                    selectedCity?.city === city.city
                      ? 'border-[#0e6b53] bg-[#edf7f2] text-[#0e6b53]'
                      : 'border-[#e2e9e5] bg-white text-[#4a5a52] hover:border-[#9fcbb9]'
                  }`}
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">{city.city}</p>
                    <p className="text-xs text-[#89958f]">{city.state}</p>
                  </div>
                </button>
              ))}
            </div>

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
                disabled={!selectedCity && !detectedArea}
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
              <p className="mt-1.5 text-sm text-[#6b7280]">Add an approximate address to help others find you.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Approximate address <span className="text-[#a1aba5] font-normal">(optional)</span></Label>
              <Input
                id="address"
                placeholder="e.g. Near Kpansia, Yenagoa"
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
                  {selectedCity ? `${selectedCity.city}, ${selectedCity.state}` : detectedArea ? `${detectedArea.city}, ${detectedArea.state}` : 'Choose your city'}
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
