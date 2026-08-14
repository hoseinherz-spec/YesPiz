import type { IconProps } from '../types';

export function BracketsRound({
  size = 24,
  color = 'currentColor',
  secondaryColor = '#84CC16',
  title,
  className,
  style,
  ...props
}: IconProps) {
  const primary = color;
  const secondary = secondaryColor;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d="M5.49414 3.62503C5.70126 3.26635 6.15986 3.14353 6.51855 3.35061C6.87725 3.55772 7.00005 4.01632 6.79297 4.37503C5.45453 6.69329 4.75001 9.32313 4.75 12C4.75 14.6769 5.45454 17.3068 6.79297 19.625C7.00007 19.9837 6.87725 20.4423 6.51855 20.6494C6.15985 20.8565 5.70126 20.7337 5.49414 20.375C4.02403 17.8287 3.25 14.9402 3.25 12C3.25001 9.0598 4.02403 6.17133 5.49414 3.62503Z" fill={primary}/>
<path d="M17.4815 3.35061C17.8402 3.14352 18.2988 3.26637 18.5059 3.62503C19.976 6.17134 20.75 9.0598 20.75 12C20.75 14.9403 19.976 17.8287 18.5059 20.375C18.2988 20.7337 17.8402 20.8565 17.4815 20.6494C17.1228 20.4423 17 19.9837 17.2071 19.625C18.5455 17.3068 19.25 14.6769 19.25 12C19.25 9.32313 18.5455 6.69329 17.2071 4.37503C17 4.01633 17.1228 3.55772 17.4815 3.35061Z" fill={secondary}/>
    </svg>
  );
}
