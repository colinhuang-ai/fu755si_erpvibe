import { CircleParking, Fuel, Receipt, Route, Utensils, Wrench, type LucideIcon } from 'lucide-react';
import type { ExpCat } from '../types';

const MAP: Record<ExpCat, LucideIcon> = { fuel: Fuel, food: Utensils, toll: Route, parking: CircleParking, repair: Wrench, other: Receipt };
export const catIcon = (c: ExpCat): LucideIcon => MAP[c];
