import type { IconProps } from '../types';

export function TestTube1({
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
      <path d="M10.793 10.25C11.4446 10.25 12.0695 10.5089 12.5303 10.9697C12.7097 11.1492 12.9532 11.25 13.207 11.25H15C15.4142 11.25 15.75 11.5858 15.75 12C15.75 12.4142 15.4142 12.75 15 12.75H13.207C12.5554 12.75 11.9305 12.4911 11.4697 12.0303C11.2903 11.8508 11.0468 11.75 10.793 11.75H9C8.58579 11.75 8.25 11.4142 8.25 11C8.25 10.5858 8.58579 10.25 9 10.25H10.793Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M17 2.25C17.4142 2.25 17.75 2.58579 17.75 3C17.75 3.41421 17.4142 3.75 17 3.75H15.75V18C15.75 20.0711 14.0711 21.75 12 21.75C9.92893 21.75 8.25 20.0711 8.25 18V3.75H7C6.58579 3.75 6.25 3.41421 6.25 3C6.25 2.58579 6.58579 2.25 7 2.25H17ZM9.75 18C9.75 19.2426 10.7574 20.25 12 20.25C13.2426 20.25 14.25 19.2426 14.25 18V3.75H9.75V18Z" fill={primary}/>
    </svg>
  );
}
