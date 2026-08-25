export type DoAmStatus = 'DRAFT' | 'PUBLISHED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export type DoAmWithCreator = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  reward: number;
  category: string | null;
  status: DoAmStatus;
  is_multi_person?: boolean;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  recurring?: string | null;
  created_at: string;
  creator?: { id: string; full_name: string; username: string; avatar_url: string | null; rating_avg: number; rating_count: number };
  _distance?: number | null;
  like_count?: number;
  comment_count?: number;
  interest_count?: number;
};

export function doAmStatusLabel(status: DoAmStatus) {
  return ({ PUBLISHED: 'OPEN', ACCEPTED: 'MATCHED', IN_PROGRESS: 'IN PROGRESS', COMPLETED: 'COMPLETED', DRAFT: 'DRAFT', CANCELLED: 'CANCELLED', EXPIRED: 'EXPIRED' } as const)[status];
}

export const DOAM_CATEGORIES = ['Errands', 'Delivery', 'Cleaning', 'Moving', 'Shopping', 'Household', 'Personal Help', 'Events', 'Repairs', 'Other'] as const;

export const formatNaira = (amount: number) => `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
export const formatDistance = (km: number) => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
export const formatTimeAgo = (value: string) => {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};
