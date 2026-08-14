import type { Pizza } from '@/constants/pizzas';

export type ProductCardProps = {
  pizza: Pizza;
  variant?: 'grid' | 'row';
  subtitle?: string;
  meta?: string;
};
