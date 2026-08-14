import type { IconProps } from '../types';

export function Molecule2({
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
      <path d="M20.2549 17.084L18.8076 17.4785L17.4014 12.3223L18.8486 11.9277L20.2549 17.084Z" fill={secondary}/>
<path d="M15.002 10.8076L10.002 15.3076L8.99805 14.1924L13.998 9.69238L15.002 10.8076Z" fill={secondary}/>
<path d="M6.97754 13.8184L5.52246 14.1816L3.64746 6.68164L5.10254 6.31836L6.97754 13.8184Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M20 16.25C21.5188 16.25 22.75 17.4812 22.75 19C22.75 20.5188 21.5188 21.75 20 21.75C18.4812 21.75 17.25 20.5188 17.25 19C17.25 17.4812 18.4812 16.25 20 16.25ZM20 17.75C19.3096 17.75 18.75 18.3096 18.75 19C18.75 19.6904 19.3096 20.25 20 20.25C20.6904 20.25 21.25 19.6904 21.25 19C21.25 18.3096 20.6904 17.75 20 17.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M7 13.25C9.07107 13.25 10.75 14.9289 10.75 17C10.75 19.0711 9.07107 20.75 7 20.75C4.92893 20.75 3.25 19.0711 3.25 17C3.25 14.9289 4.92893 13.25 7 13.25ZM7 14.75C5.75736 14.75 4.75 15.7574 4.75 17C4.75 18.2426 5.75736 19.25 7 19.25C8.24264 19.25 9.25 18.2426 9.25 17C9.25 15.7574 8.24264 14.75 7 14.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M17 3.25C19.6234 3.25 21.75 5.37665 21.75 8C21.75 10.6234 19.6234 12.75 17 12.75C14.3766 12.75 12.25 10.6234 12.25 8C12.25 5.37665 14.3766 3.25 17 3.25ZM17 4.75C15.2051 4.75 13.75 6.20507 13.75 8C13.75 9.79493 15.2051 11.25 17 11.25C18.7949 11.25 20.25 9.79493 20.25 8C20.25 6.20507 18.7949 4.75 17 4.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M4 2.25C5.51878 2.25 6.75 3.48122 6.75 5C6.75 6.51878 5.51878 7.75 4 7.75C2.48122 7.75 1.25 6.51878 1.25 5C1.25 3.48122 2.48122 2.25 4 2.25ZM4 3.75C3.30964 3.75 2.75 4.30964 2.75 5C2.75 5.69036 3.30964 6.25 4 6.25C4.69036 6.25 5.25 5.69036 5.25 5C5.25 4.30964 4.69036 3.75 4 3.75Z" fill={primary}/>
    </svg>
  );
}
