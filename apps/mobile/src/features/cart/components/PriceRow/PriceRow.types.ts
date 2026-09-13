import type { ReactNode } from "react";
export type PriceRowProps = {
  label: string;
  value: ReactNode;
  bold?: boolean;
  accent?: boolean;
  success?: boolean;
};
