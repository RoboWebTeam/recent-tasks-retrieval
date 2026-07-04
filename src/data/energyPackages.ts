import { apiUrl } from '@/lib/apiConfig';

export interface EnergyPackage {
  code: string;
  requests: number;
  price: number;
}

export const ENERGY_PRICING_URL = apiUrl('energy-pricing');

export const FALLBACK_ENERGY_PACKAGES: EnergyPackage[] = [
  { code: 'small', requests: 20, price: 500 },
  { code: 'medium', requests: 40, price: 1000 },
  { code: 'large', requests: 100, price: 2500 },
  { code: 'xlarge', requests: 200, price: 5000 },
];
