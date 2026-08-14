import type { IconProps } from '../types';

export function LetterJ({
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
      <path d="M16 2.25C16.4142 2.25 16.75 2.58579 16.75 3V18C16.75 20.0711 15.0711 21.75 13 21.75H11C8.92893 21.75 7.25 20.0711 7.25 18V16C7.25 15.5858 7.58579 15.25 8 15.25C8.41421 15.25 8.75 15.5858 8.75 16V18C8.75 19.2426 9.75736 20.25 11 20.25H13C14.2426 20.25 15.25 19.2426 15.25 18V3C15.25 2.58579 15.5858 2.25 16 2.25Z" fill={primary}/>
    </svg>
  );
}
