import type { IconProps } from '../types';

export function Clock({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill={primary}/>
<path d="M12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V10.4004C12.75 10.6926 12.7502 10.867 12.7607 10.9961C12.7706 11.1162 12.7857 11.1297 12.7773 11.1133C12.8013 11.1603 12.8397 11.1987 12.8867 11.2227C12.8703 11.2143 12.8838 11.2294 13.0039 11.2393C13.133 11.2498 13.3074 11.25 13.5996 11.25H18C18.4142 11.25 18.75 11.5858 18.75 12C18.75 12.4142 18.4142 12.75 18 12.75H13.5996C13.3321 12.75 13.0861 12.7501 12.8818 12.7334C12.6688 12.716 12.4353 12.6769 12.2051 12.5596C11.876 12.3918 11.6082 12.124 11.4404 11.7949C11.3231 11.5647 11.284 11.3312 11.2666 11.1182C11.2499 10.9139 11.25 10.6679 11.25 10.4004V6C11.25 5.58579 11.5858 5.25 12 5.25Z" fill={secondary}/>
    </svg>
  );
}
