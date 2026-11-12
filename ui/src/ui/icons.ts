import {
  ShieldCheck, Droplet, Flame, Truck, Fuel, IdCard, HeartPulse, Lock, BookOpen, type LucideIcon
} from 'lucide-react';

/** Map tên icon trong dữ liệu mock sang component lucide */
export const ICON: Record<string, LucideIcon> = {
  shield: ShieldCheck, droplet: Droplet, flame: Flame, truck: Truck, fuel: Fuel,
  id: IdCard, heart: HeartPulse, lock: Lock, book: BookOpen
};
export const iconOf = (k: string): LucideIcon => ICON[k] ?? BookOpen;
