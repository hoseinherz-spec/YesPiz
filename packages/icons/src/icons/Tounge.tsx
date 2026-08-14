import type { IconProps } from '../types';

export function Tounge({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M21 3.25C21.4142 3.25 21.75 3.58579 21.75 4C21.75 4.41421 21.4142 4.75 21 4.75H17.75V11C17.75 14.1756 15.1756 16.75 12 16.75C8.82436 16.75 6.25 14.1756 6.25 11V4.75H3C2.58579 4.75 2.25 4.41421 2.25 4C2.25 3.58579 2.58579 3.25 3 3.25H21ZM7.75 11C7.75 13.3472 9.65279 15.25 12 15.25C14.3472 15.25 16.25 13.3472 16.25 11V4.75H12.75V12C12.75 12.4142 12.4142 12.75 12 12.75C11.5858 12.75 11.25 12.4142 11.25 12V4.75H7.75V11Z" fill={primary}/>
<path d="M9 20.25C9.41421 20.25 9.75 20.5858 9.75 21C9.75 21.4142 9.41421 21.75 9 21.75C8.58579 21.75 8.25 21.4142 8.25 21C8.25 20.5858 8.58579 20.25 9 20.25Z" fill={secondary}/>
<path d="M15 20.25C15.4142 20.25 15.75 20.5858 15.75 21C15.75 21.4142 15.4142 21.75 15 21.75C14.5858 21.75 14.25 21.4142 14.25 21C14.25 20.5858 14.5858 20.25 15 20.25Z" fill={secondary}/>
<path d="M6 18.25C6.41421 18.25 6.75 18.5858 6.75 19C6.75 19.4142 6.41421 19.75 6 19.75C5.58579 19.75 5.25 19.4142 5.25 19C5.25 18.5858 5.58579 18.25 6 18.25Z" fill={secondary}/>
<path d="M12 18.25C12.4142 18.25 12.75 18.5858 12.75 19C12.75 19.4142 12.4142 19.75 12 19.75C11.5858 19.75 11.25 19.4142 11.25 19C11.25 18.5858 11.5858 18.25 12 18.25Z" fill={secondary}/>
<path d="M18 18.25C18.4142 18.25 18.75 18.5858 18.75 19C18.75 19.4142 18.4142 19.75 18 19.75C17.5858 19.75 17.25 19.4142 17.25 19C17.25 18.5858 17.5858 18.25 18 18.25Z" fill={secondary}/>
    </svg>
  );
}
