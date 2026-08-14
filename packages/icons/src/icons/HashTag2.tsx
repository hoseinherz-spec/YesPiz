import type { IconProps } from '../types';

export function HashTag2({
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
      <path d="M9 2.25C9.41421 2.25 9.75 2.58579 9.75 3V21C9.75 21.4142 9.41421 21.75 9 21.75C8.58579 21.75 8.25 21.4142 8.25 21V3C8.25 2.58579 8.58579 2.25 9 2.25Z" fill={primary}/>
<path d="M15 2.25C15.4142 2.25 15.75 2.58579 15.75 3V21C15.75 21.4142 15.4142 21.75 15 21.75C14.5858 21.75 14.25 21.4142 14.25 21V3C14.25 2.58579 14.5858 2.25 15 2.25Z" fill={primary}/>
<path d="M21 14.25C21.4142 14.25 21.75 14.5858 21.75 15C21.75 15.4142 21.4142 15.75 21 15.75H3C2.58579 15.75 2.25 15.4142 2.25 15C2.25 14.5858 2.58578 14.25 3 14.25H21Z" fill={secondary}/>
<path d="M21 8.25C21.4142 8.25 21.75 8.58579 21.75 9C21.75 9.41421 21.4142 9.75 21 9.75H3C2.58579 9.75 2.25 9.41421 2.25 9C2.25 8.58579 2.58578 8.25 3 8.25H21Z" fill={secondary}/>
    </svg>
  );
}
