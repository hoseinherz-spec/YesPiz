import type { IconProps } from '../types';

export function FitnessBike3({
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
      <path d="M14 3H18.5C19.8807 3 21 4.11929 21 5.5C21 6.88071 19.8807 8 18.5 8H17.5798C16.0528 8 14.7108 9.01229 14.2913 10.4806L13 15" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M3.5 8L9.5 8" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M8 12L6 8" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M7 12H8.79899C9.16543 12 9.34865 12 9.52297 12.0311C9.80771 12.0819 10.078 12.1939 10.3153 12.3593C10.4606 12.4606 10.5901 12.5901 10.8492 12.8492L14.2721 16.2721L14.2721 16.2721C14.4118 16.4118 14.4816 16.4816 14.5552 16.5423C14.8633 16.7967 15.2405 16.9529 15.6381 16.9909C15.7331 17 15.8319 17 16.0294 17H19.5C20.3284 17 21 17.6716 21 18.5C21 19.3284 20.3284 20 19.5 20H7C4.79086 20 3 18.2091 3 16C3 13.7909 4.79086 12 7 12Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
<path d="M10 17.5L7 14.5" stroke="#84CC16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
