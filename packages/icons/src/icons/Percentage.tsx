import type { IconProps } from '../types';

export function Percentage({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M16.5 13.25C18.2949 13.25 19.75 14.7051 19.75 16.5C19.75 18.2949 18.2949 19.75 16.5 19.75C14.7051 19.75 13.25 18.2949 13.25 16.5C13.25 14.7051 14.7051 13.25 16.5 13.25ZM16.5 14.75C15.5335 14.75 14.75 15.5335 14.75 16.5C14.75 17.4665 15.5335 18.25 16.5 18.25C17.4665 18.25 18.25 17.4665 18.25 16.5C18.25 15.5335 17.4665 14.75 16.5 14.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M7.5 4.25C9.29493 4.25 10.75 5.70507 10.75 7.5C10.75 9.29493 9.29493 10.75 7.5 10.75C5.70507 10.75 4.25 9.29493 4.25 7.5C4.25 5.70507 5.70507 4.25 7.5 4.25ZM7.5 5.75C6.5335 5.75 5.75 6.5335 5.75 7.5C5.75 8.4665 6.5335 9.25 7.5 9.25C8.4665 9.25 9.25 8.4665 9.25 7.5C9.25 6.5335 8.4665 5.75 7.5 5.75Z" fill={primary}/>
<path d="M18.4697 4.46967C18.7626 4.17678 19.2373 4.17678 19.5302 4.46967C19.8231 4.76257 19.8231 5.23734 19.5302 5.53022L5.53022 19.5302C5.23734 19.8231 4.76257 19.8231 4.46967 19.5302C4.17678 19.2373 4.17678 18.7626 4.46967 18.4697L18.4697 4.46967Z" fill={secondary}/>
    </svg>
  );
}
