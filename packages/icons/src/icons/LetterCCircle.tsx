import type { IconProps } from '../types';

export function LetterCCircle({
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
<path d="M12.25 6.75C13.7688 6.75 15 7.98122 15 9.5V10.2227C14.9998 10.6367 14.6641 10.9727 14.25 10.9727C13.8359 10.9727 13.5002 10.6367 13.5 10.2227V9.5C13.5 8.80964 12.9404 8.25 12.25 8.25H11.75C11.0596 8.25 10.5 8.80964 10.5 9.5V14.5C10.5 15.1904 11.0596 15.75 11.75 15.75H12.25C12.9404 15.75 13.5 15.1904 13.5 14.5V14.2227C13.5 13.8084 13.8358 13.4727 14.25 13.4727C14.6642 13.4727 15 13.8084 15 14.2227V14.5C15 16.0188 13.7688 17.25 12.25 17.25H11.75C10.2312 17.25 9 16.0188 9 14.5V9.5C9 7.98122 10.2312 6.75 11.75 6.75H12.25Z" fill={secondary}/>
    </svg>
  );
}
