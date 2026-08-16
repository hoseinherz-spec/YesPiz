'use client';

import { Button, Card, Typography } from '@heroui/react';
import { Heart, Plus } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Rating } from '@/components/Rating';
import { pizzaTagline } from '@/constants/i18n';
import { formatPrice, resolveProductImage } from '@/constants/pizzas';
import { useApp } from '@/context/AppContext';

import { ProductImage } from '../ProductImage/ProductImage';
import { productCard } from './ProductCard.styles';
import type { ProductCardProps } from './ProductCard.types';

export function ProductCard({
  pizza,
  variant = 'grid',
  subtitle,
  meta,
}: ProductCardProps) {
  const router = useRouter();
  const { language, isFavorite, toggleFavorite } = useApp();
  const [spinning, setSpinning] = useState(false);
  const image = resolveProductImage(pizza);
  const fav = isFavorite(pizza.id);
  const tagline = subtitle ?? pizzaTagline(pizza, language);
  const styles = productCard({ variant, spinning });

  const go = () => {
    setSpinning(true);
    window.setTimeout(() => {
      router.push(`/pizza/?id=${encodeURIComponent(pizza.id)}`);
    }, 420);
  };

  const onFavoritePress = () => {
    toggleFavorite(pizza.id);
  };

  if (variant === 'row') {
    return (
      <Card className={styles.card()}>
        <Button
          variant="ghost"
          aria-label={pizza.name}
          onPress={go}
          className={styles.hitArea()}
        />
        <Card.Content className={styles.content()}>
          <div className={styles.imageWrap()}>
            <ProductImage src={image} alt={pizza.name} className={styles.image()} />
            <Button
              isIconOnly
              variant="ghost"
              aria-label={fav ? `Remove ${pizza.name} from saved` : `Save ${pizza.name}`}
              onPress={() => onFavoritePress()}
              className={styles.favorite()}
            >
              <Heart
                size={14}
                fill={fav ? 'var(--danger)' : 'transparent'}
                color={fav ? 'var(--danger)' : '#fff'}
              />
            </Button>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5 pointer-events-none">
            <div>
              <Typography type="h6" className={styles.title()}>
                {pizza.name}
              </Typography>
              <Typography type="body-sm" className={styles.subtitle()}>
                {tagline}
              </Typography>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Rating value={pizza.rating} />
                {meta ? (
                  <Typography type="body-xs" className={styles.meta()}>
                    {meta}
                  </Typography>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Typography type="body-sm" className={styles.price()}>
                  {formatPrice(pizza.price)}
                </Typography>
                <span className={styles.addButton()} aria-hidden="true">
                  <Plus size={16} />
                </span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className={styles.card()}>
      <Button
        variant="ghost"
        aria-label={pizza.name}
        onPress={go}
        className={styles.hitArea()}
      />
      <div
        className={styles.imageWrap()}
        style={{
          background:
            'radial-gradient(circle at 50% 60%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 60%), var(--surface)',
        }}
      >
        <ProductImage src={image} alt={pizza.name} className={styles.image()} />
        <Button
          isIconOnly
          variant="ghost"
          aria-label={fav ? `Remove ${pizza.name} from saved` : `Save ${pizza.name}`}
          onPress={() => onFavoritePress()}
          className={styles.favorite()}
        >
          <Heart
            size={14}
            fill={fav ? 'var(--danger)' : 'transparent'}
            color={fav ? 'var(--danger)' : '#fff'}
          />
        </Button>
      </div>
      <Card.Content className={styles.content()}>
        <Typography type="h6" className={styles.title()}>
          {pizza.name}
        </Typography>
        <div className="mt-auto flex items-center justify-between">
          <Rating value={pizza.rating} />
          <div className="flex items-center gap-1.5">
            <Typography type="body-sm" className={styles.price()}>
              {formatPrice(pizza.price)}
            </Typography>
            <span className={styles.addButton()} aria-hidden="true">
              <Plus size={14} />
            </span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
