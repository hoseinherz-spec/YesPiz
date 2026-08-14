import type { IconProps } from '../types';

export function WaveSine({
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
      <path d="M9 2.25C11.0711 2.25 12.75 3.92893 12.75 6V18C12.75 19.2426 13.7574 20.25 15 20.25C16.2426 20.25 17.25 19.2426 17.25 18V16C17.25 13.3766 19.3766 11.25 22 11.25C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75C20.2051 12.75 18.75 14.2051 18.75 16V18C18.75 20.0711 17.0711 21.75 15 21.75C12.9289 21.75 11.25 20.0711 11.25 18V6C11.25 4.75736 10.2426 3.75 9 3.75C7.75736 3.75 6.75 4.75736 6.75 6V8C6.75 10.6234 4.62335 12.75 2 12.75C1.58579 12.75 1.25 12.4142 1.25 12C1.25 11.5858 1.58579 11.25 2 11.25C3.79493 11.25 5.25 9.79493 5.25 8V6C5.25 3.92893 6.92893 2.25 9 2.25Z" fill={primary}/>
    </svg>
  );
}
