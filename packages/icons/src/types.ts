import type { ReactElement, SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & {
  /** Icon width/height in px (or CSS size). Defaults to 24. */
  size?: number | string;
  /** Primary path color (replaces black). Defaults to currentColor. */
  color?: string;
  /** Accent path color (replaces #84CC16). Defaults to #84CC16. */
  secondaryColor?: string;
  /** Optional accessible title. */
  title?: string;
};

export type IconComponent = (props: IconProps) => ReactElement;
