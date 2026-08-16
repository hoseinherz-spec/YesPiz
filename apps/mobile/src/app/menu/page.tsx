'use client';

import { Button, Drawer, SearchField, Typography } from '@heroui/react';
import { ArrowLeft, Bookmark, Search, SlidersHorizontal } from '@repo/icons';
import { useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';

import { AppFrame } from '@/components/AppFrame';
import { IconBadgeButton } from '@/components/IconBadgeButton';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { useApp } from '@/context/AppContext';
import { useMenuCatalog, type CatalogPizza } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

const CATEGORIES = ['All', 'Popular', 'Classic', 'Spicy', 'Veggie', 'Premium'] as const;
const SORTS = ['Recommended', 'Top Rated', 'Fastest', 'Low Price', 'High Price'] as const;
const PRICES = ['Any price', 'Under €12', '€12–€14', '€14+'] as const;

type Category = (typeof CATEGORIES)[number];
type Sort = (typeof SORTS)[number];
type Price = (typeof PRICES)[number];

function matchesCategory(pizza: CatalogPizza, category: Category): boolean {
  if (category === 'All') return true;
  const tags = pizza.tags.map((tag) => tag.toLowerCase());
  if (category === 'Popular') return pizza.rating >= 4.8;
  if (category === 'Spicy') {
    return pizza.id === 'diavola' || pizza.id === 'pepperoni' || tags.some((tag) => tag.includes('spicy'));
  }
  if (category === 'Veggie') {
    return ['vegetariana', 'funghi', 'quattro-formaggi', 'margherita'].includes(pizza.id)
      || tags.some((tag) => tag.includes('veg'));
  }
  if (category === 'Premium') return pizza.price >= 13;
  return pizza.price < 13 && !matchesCategory(pizza, 'Spicy');
}

function matchesPrice(price: number, filter: Price) {
  if (filter === 'Under €12') return price < 12;
  if (filter === '€12–€14') return price >= 12 && price < 14;
  if (filter === '€14+') return price >= 14;
  return true;
}

export default function MenuPage() {
  const router = useRouter();
  const { t } = useApp();
  const { items, isOffline, isLoading } = useMenuCatalog();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All');
  const [sort, setSort] = useState<Sort>('Recommended');
  const [price, setPrice] = useState<Price>('Any price');
  const [draftCategory, setDraftCategory] = useState<Category>('All');
  const [draftSort, setDraftSort] = useState<Sort>('Recommended');
  const [draftPrice, setDraftPrice] = useState<Price>('Any price');

  const list = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let next = items.filter((pizza) => {
      const haystack = [pizza.name, pizza.tagline, ...pizza.ingredients]
        .join(' ')
        .toLowerCase();
      return (
        haystack.includes(normalizedQuery)
        && matchesCategory(pizza, category)
        && matchesPrice(pizza.price, price)
      );
    });
    if (sort === 'Top Rated') next = [...next].sort((a, b) => b.rating - a.rating);
    if (sort === 'Fastest') next = [...next].sort((a, b) => a.prepTime - b.prepTime);
    if (sort === 'Low Price') next = [...next].sort((a, b) => a.price - b.price);
    if (sort === 'High Price') next = [...next].sort((a, b) => b.price - a.price);
    return next;
  }, [category, items, price, query, sort]);

  const activeFilters = Number(category !== 'All') + Number(sort !== 'Recommended') + Number(price !== 'Any price');

  const prepareFilters = () => {
    setDraftCategory(category);
    setDraftSort(sort);
    setDraftPrice(price);
  };

  const applyFilters = () => {
    setCategory(draftCategory);
    setSort(draftSort);
    setPrice(draftPrice);
  };

  const clearFilters = () => {
    setQuery('');
    setCategory('All');
    setSort('Recommended');
    setPrice('Any price');
    setDraftCategory('All');
    setDraftSort('Recommended');
    setDraftPrice('Any price');
  };

  return (
    <AppFrame withTabs>
      <div className="flex items-center justify-between gap-3">
        <IconBadgeButton aria-label="Back to home" onPress={() => router.push('/home/')}>
          <ArrowLeft size={20} />
        </IconBadgeButton>
        <Typography type="h3" className={hx.h3}>
          {t('menu.title')}
        </Typography>
        <IconBadgeButton href="/saved/" aria-label="Saved pizzas">
          <Bookmark size={19} />
        </IconBadgeButton>
      </div>

      {isOffline ? (
        <div className="mt-5 rounded-[18px] border border-warning/40 bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] px-4 py-3">
          <Typography type="body-xs" className={cn(hx.caption, 'text-warning')}>
            {t('login.offlineBanner')}
          </Typography>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_64px] gap-2">
        <SearchField
          className="w-full"
          value={query}
          onChange={setQuery}
          aria-label={t('menu.search')}
        >
          <SearchField.Group className="h-16 rounded-full border-0 bg-field-background px-3 shadow-none">
            <SearchField.SearchIcon className="text-muted" />
            <SearchField.Input
              placeholder={t('menu.search')}
              className="text-[14px] font-medium text-foreground placeholder:text-field-placeholder"
            />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <Drawer>
          <Button
            isIconOnly
            variant="secondary"
            aria-label="Open filters"
            onPress={prepareFilters}
            className="relative size-16 min-w-16 rounded-full border-0 bg-field-background text-foreground"
          >
            <SlidersHorizontal size={21} />
            {activeFilters > 0 ? (
              <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-extrabold text-accent-foreground">
                {activeFilters}
              </span>
            ) : null}
          </Button>
          <Drawer.Backdrop className="bg-black/60 backdrop-blur-sm">
            <Drawer.Content
              placement="bottom"
              className="mx-auto max-h-[88dvh] w-full max-w-[473px] rounded-t-[42px] bg-surface text-surface-foreground"
            >
              <Drawer.Dialog className="outline-none">
                <Drawer.Handle className="bg-muted" />
                <Drawer.Header className="flex items-center justify-between px-[clamp(22px,8vw,38px)] pt-3">
                  <Drawer.Heading className="text-[27px] font-extrabold">
                    Filters
                  </Drawer.Heading>
                  <Button
                    variant="ghost"
                    onPress={() => {
                      setDraftCategory('All');
                      setDraftSort('Recommended');
                      setDraftPrice('Any price');
                    }}
                    className="rounded-full text-[13px] text-muted"
                  >
                    Reset
                  </Button>
                </Drawer.Header>
                <Drawer.Body className="px-[clamp(22px,8vw,38px)] pb-3">
                  <FilterSection title="Categories">
                    {CATEGORIES.map((option) => (
                      <Button
                        key={option}
                        variant={draftCategory === option ? 'primary' : 'secondary'}
                        className={hx.filterChip(draftCategory === option)}
                        onPress={() => setDraftCategory(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </FilterSection>

                  <FilterSection title="Sort by">
                    {SORTS.map((option) => (
                      <Button
                        key={option}
                        variant={draftSort === option ? 'primary' : 'secondary'}
                        className={hx.filterChip(draftSort === option)}
                        onPress={() => setDraftSort(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </FilterSection>

                  <FilterSection title="Price range">
                    {PRICES.map((option) => (
                      <Button
                        key={option}
                        variant={draftPrice === option ? 'primary' : 'secondary'}
                        className={hx.filterChip(draftPrice === option)}
                        onPress={() => setDraftPrice(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </FilterSection>
                </Drawer.Body>
                <Drawer.Footer className="px-[clamp(22px,8vw,38px)] pb-[max(20px,env(safe-area-inset-bottom))]">
                  <Button
                    slot="close"
                    variant="primary"
                    fullWidth
                    onPress={applyFilters}
                    className={hx.btnPrimary}
                  >
                    Apply filters
                  </Button>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      </div>

      <div className="mt-7 flex items-end justify-between gap-3">
        <Typography type="h1" className={cn(hx.h1, 'max-w-[270px] text-[clamp(30px,9vw,42px)]')}>
          {list.length}+ Results Found
        </Typography>
        <Search size={34} color="var(--foreground)" />
      </div>

      {isLoading && items.length === 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-3" aria-label="Loading menu">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[250px] animate-pulse rounded-[28px] bg-card" />
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-6 pb-4">
          {list.map((pizza) => (
            <ProductCard key={pizza.id} pizza={pizza} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-[32px] border border-border px-5 py-10 text-center">
          <Search size={34} color="var(--muted)" />
          <Typography type="h3" className={cn(hx.h3, 'mt-4')}>
            No pizzas found
          </Typography>
          <Typography type="body-sm" className={cn(hx.bodySm, 'mt-2 max-w-[260px]')}>
            Try another search or reset your filters.
          </Typography>
          <Button variant="primary" className="mt-5 rounded-full px-6" onPress={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

    </AppFrame>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6">
      <Typography type="h3" className={hx.h3}>
        {title}
      </Typography>
      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">{children}</div>
    </section>
  );
}
