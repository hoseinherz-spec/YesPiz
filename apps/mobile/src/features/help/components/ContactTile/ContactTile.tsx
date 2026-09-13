'use client';
import { AppText } from "@/components/Text";


import { Card, Typography } from '@heroui/react';

import { cn } from '@/lib/cn';
import { hx } from '@/lib/heroui-classes';

import type { ContactTileProps } from './ContactTile.types';

export function ContactTile({ icon, title, detail }: ContactTileProps) {
  return (
    <Card className={cn(hx.card, '!p-3')}>
      <Card.Content className="p-0">
        <AppText as="span" className="text-accent">{icon}</AppText>
        <Typography type="h6" className={cn(hx.title, 'mt-2')}>
          {title}
        </Typography>
        <Typography type="body-xs" className={cn(hx.caption, 'mt-0.5')}>
          {detail}
        </Typography>
      </Card.Content>
    </Card>
  );
}
