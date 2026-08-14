import type { IconProps } from '../types';

export function ChartWaterfall1({
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
      <path d="M6 14.25C6.41421 14.25 6.75 14.5858 6.75 15V21C6.75 21.4142 6.41421 21.75 6 21.75C5.58579 21.75 5.25 21.4142 5.25 21V15C5.25 14.5858 5.58579 14.25 6 14.25Z" fill={primary}/>
<path d="M18 2.25C18.4142 2.25 18.75 2.58579 18.75 3V21C18.75 21.4142 18.4142 21.75 18 21.75C17.5858 21.75 17.25 21.4142 17.25 21V3C17.25 2.58579 17.5858 2.25 18 2.25Z" fill={primary}/>
<path d="M14 2.25C14.4142 2.25 14.75 2.58579 14.75 3V9C14.75 9.41421 14.4142 9.75 14 9.75C13.5858 9.75 13.25 9.41421 13.25 9V3C13.25 2.58579 13.5858 2.25 14 2.25Z" fill={primary}/>
<path d="M10 8.25C10.4142 8.25 10.75 8.58579 10.75 9V15C10.75 15.4142 10.4142 15.75 10 15.75C9.58579 15.75 9.25 15.4142 9.25 15V9C9.25 8.58579 9.58579 8.25 10 8.25Z" fill={secondary}/>
    </svg>
  );
}
