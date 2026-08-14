import type { IconProps } from '../types';

export function Printer({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M16 3.25C16.9665 3.25 17.75 4.0335 17.75 5V7.30859C20.017 7.66816 21.75 9.63183 21.75 12V16C21.75 16.4142 21.4142 16.75 21 16.75H17.75V19C17.75 19.9665 16.9665 20.75 16 20.75H8C7.0335 20.75 6.25 19.9665 6.25 19V16.75H3C2.58579 16.75 2.25 16.4142 2.25 16V12C2.25 9.63183 3.98299 7.66816 6.25 7.30859V5C6.25 4.0335 7.0335 3.25 8 3.25H16ZM7.75 19C7.75 19.1381 7.86193 19.25 8 19.25H16C16.1381 19.25 16.25 19.1381 16.25 19V15.75H7.75V19ZM7 8.75C5.20507 8.75 3.75 10.2051 3.75 12V15.25H6.25V15C6.25 14.5858 6.58579 14.25 7 14.25H17C17.4142 14.25 17.75 14.5858 17.75 15V15.25H20.25V12C20.25 10.2051 18.7949 8.75 17 8.75H7ZM8 4.75C7.86193 4.75 7.75 4.86193 7.75 5V7.25H16.25V5C16.25 4.86193 16.1381 4.75 16 4.75H8Z" fill={primary}/>
<circle cx="18" cy="12" r="1" fill={secondary}/>
    </svg>
  );
}
