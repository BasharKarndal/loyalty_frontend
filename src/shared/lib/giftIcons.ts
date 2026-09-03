import type { LucideIcon } from 'lucide-react';
import {
  Cake,
  Coffee,
  CupSoda,
  Gift,
  Heart,
  Pizza,
  Sandwich,
  Star,
  Trophy,
  Utensils,
} from 'lucide-react';

export const GIFT_ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'card_giftcard', label: 'هدية', icon: Gift },
  { key: 'star', label: 'نجمة', icon: Star },
  { key: 'favorite', label: 'قلب', icon: Heart },
  { key: 'emoji_events', label: 'كأس', icon: Trophy },
  { key: 'coffee', label: 'قهوة', icon: Coffee },
  { key: 'cake', label: 'كيك', icon: Cake },
  { key: 'local_pizza', label: 'بيتza', icon: Pizza },
  { key: 'local_drink', label: 'مشروب', icon: CupSoda },
  { key: 'fastfood', label: 'وجبة', icon: Sandwich },
  { key: 'restaurant', label: 'مطعم', icon: Utensils },
];

const iconMap = Object.fromEntries(GIFT_ICON_OPTIONS.map((item) => [item.key, item.icon]));

export function resolveGiftIcon(iconKey: string): LucideIcon {
  return iconMap[iconKey] ?? Gift;
}

export const DEFAULT_GIFT_ICON_KEY = 'card_giftcard';
