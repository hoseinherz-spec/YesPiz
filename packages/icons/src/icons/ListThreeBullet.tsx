import type { IconProps } from '../types';

export function ListThreeBullet({
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
      <path d="M4.5 16.75C5.19036 16.75 5.75 17.3096 5.75 18C5.75 18.6904 5.19036 19.25 4.5 19.25C3.80964 19.25 3.25 18.6904 3.25 18C3.25 17.3096 3.80964 16.75 4.5 16.75Z" fill={primary}/>
<path d="M21 17.25C21.4142 17.25 21.75 17.5858 21.75 18C21.75 18.4142 21.4142 18.75 21 18.75H9C8.58579 18.75 8.25 18.4142 8.25 18C8.25 17.5858 8.58579 17.25 9 17.25H21Z" fill={primary}/>
<path d="M4.5 4.75C5.19036 4.75 5.75 5.30964 5.75 6C5.75 6.69036 5.19036 7.25 4.5 7.25C3.80964 7.25 3.25 6.69036 3.25 6C3.25 5.30964 3.80964 4.75 4.5 4.75Z" fill={primary}/>
<path d="M21 5.25C21.4142 5.25 21.75 5.58579 21.75 6C21.75 6.41421 21.4142 6.75 21 6.75H9C8.58579 6.75 8.25 6.41421 8.25 6C8.25 5.58579 8.58579 5.25 9 5.25H21Z" fill={primary}/>
<path d="M4.5 10.75C5.19036 10.75 5.75 11.3096 5.75 12C5.75 12.6904 5.19036 13.25 4.5 13.25C3.80964 13.25 3.25 12.6904 3.25 12C3.25 11.3096 3.80964 10.75 4.5 10.75Z" fill={secondary}/>
<path d="M21 11.25C21.4142 11.25 21.75 11.5858 21.75 12C21.75 12.4142 21.4142 12.75 21 12.75H9C8.58579 12.75 8.25 12.4142 8.25 12C8.25 11.5858 8.58579 11.25 9 11.25H21Z" fill={secondary}/>
    </svg>
  );
}
