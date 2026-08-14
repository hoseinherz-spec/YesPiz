import type { IconProps } from '../types';

export function JumpingRope({
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
      <path d="M7 15.25C7.41421 15.25 7.75 15.5858 7.75 16C7.75 16.4142 7.41421 16.75 7 16.75H3C2.58579 16.75 2.25 16.4142 2.25 16C2.25 15.5858 2.58579 15.25 3 15.25H7Z" fill={secondary}/>
<path d="M21 7.25C21.4142 7.25 21.75 7.58579 21.75 8C21.75 8.41421 21.4142 8.75 21 8.75H17C16.5858 8.75 16.25 8.41421 16.25 8C16.25 7.58579 16.5858 7.25 17 7.25H21Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M19 2.25C20.5188 2.25 21.75 3.48122 21.75 5V11C21.75 11.4142 21.4142 11.75 21 11.75H19.75V17.5C19.75 19.8472 17.8472 21.75 15.5 21.75C13.1528 21.75 11.25 19.8472 11.25 17.5V6.5C11.25 4.98122 10.0188 3.75 8.5 3.75C6.98122 3.75 5.75 4.98122 5.75 6.5V12.25H7C7.41421 12.25 7.75 12.5858 7.75 13V19C7.75 20.5188 6.51878 21.75 5 21.75C3.48122 21.75 2.25 20.5188 2.25 19V13C2.25 12.5858 2.58579 12.25 3 12.25H4.25V6.5C4.25 4.15279 6.15279 2.25 8.5 2.25C10.8472 2.25 12.75 4.15279 12.75 6.5V17.5C12.75 19.0188 13.9812 20.25 15.5 20.25C17.0188 20.25 18.25 19.0188 18.25 17.5V11.75H17C16.5858 11.75 16.25 11.4142 16.25 11V5C16.25 3.48122 17.4812 2.25 19 2.25ZM3.75 19C3.75 19.6904 4.30964 20.25 5 20.25C5.69036 20.25 6.25 19.6904 6.25 19V13.75H3.75V19ZM19 3.75C18.3096 3.75 17.75 4.30964 17.75 5V10.25H20.25V5C20.25 4.30964 19.6904 3.75 19 3.75Z" fill={primary}/>
    </svg>
  );
}
