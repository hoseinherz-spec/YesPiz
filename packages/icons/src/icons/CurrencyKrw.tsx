import type { IconProps } from '../types';

export function CurrencyKrw({
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
      <path d="M20 3.25C20.4142 3.25 20.75 3.58579 20.75 4V5.92578C20.75 7.82472 20.4269 9.71029 19.7949 11.501L16.707 20.25C16.5982 20.5577 16.3028 20.7602 15.9766 20.75C15.6502 20.7398 15.3676 20.5192 15.2783 20.2051L12 8.67578L8.72168 20.2051C8.63236 20.5192 8.34982 20.7398 8.02344 20.75C7.69716 20.7602 7.40178 20.5577 7.29297 20.25L4.20508 11.501C3.57307 9.71029 3.25 7.82472 3.25 5.92578V4C3.25 3.58579 3.58579 3.25 4 3.25C4.41421 3.25 4.75 3.58579 4.75 4V5.92578C4.75 7.65467 5.04373 9.37163 5.61914 11.002L7.92188 17.5283L11.2783 5.72852L11.3223 5.6123C11.4446 5.35371 11.7067 5.18359 12 5.18359C12.3352 5.18359 12.63 5.40609 12.7217 5.72852L16.0771 17.5283L18.3809 11.002C18.9563 9.37163 19.25 7.65467 19.25 5.92578V4C19.25 3.58579 19.5858 3.25 20 3.25Z" fill={primary}/>
<path d="M22 11.25C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75H2C1.58579 12.75 1.25 12.4142 1.25 12C1.25 11.5858 1.58579 11.25 2 11.25H22Z" fill={secondary}/>
    </svg>
  );
}
