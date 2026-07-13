import { apiUrl } from '@/lib/apiConfig';

export interface EnergyPackage {
  code: string;
  requests: number;
  price: number;
}

export const ENERGY_PRICING_URL = apiUrl('energy-pricing');

export const FALLBACK_ENERGY_PACKAGES: EnergyPackage[] = [
  { code: 'small', requests: 12, price: 490 },
  { code: 'medium', requests: 25, price: 990 },
  { code: 'large', requests: 54, price: 1990 },
  { code: 'xlarge', requests: 145, price: 4990 },
];
