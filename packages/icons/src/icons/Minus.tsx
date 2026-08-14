import type { IconProps } from '../types';

export function Minus({
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
      <path d="M21 11.25C21.4142 11.25 21.75 11.5858 21.75 12C21.75 12.4142 21.4142 12.75 21 12.75H3C2.58579 12.75 2.25 12.4142 2.25 12C2.25 11.5858 2.58579 11.25 3 11.25H21Z" fill={primary}/>
    </svg>
  );
}
