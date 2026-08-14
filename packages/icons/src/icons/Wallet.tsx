import type { IconProps } from '../types';

export function Wallet({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M19 3.25C19.4142 3.25 19.75 3.58579 19.75 4C19.75 4.41421 19.4142 4.75 19 4.75H7C5.20507 4.75 3.75 6.20507 3.75 8V8.53809C4.59977 7.74002 5.74224 7.25 7 7.25H17C19.6234 7.25 21.75 9.37665 21.75 12V16C21.75 18.6234 19.6234 20.75 17 20.75H7C4.37665 20.75 2.25 18.6234 2.25 16V8C2.25 5.37665 4.37665 3.25 7 3.25H19ZM7 8.75C5.20507 8.75 3.75 10.2051 3.75 12V16C3.75 17.7949 5.20507 19.25 7 19.25H17C18.7949 19.25 20.25 17.7949 20.25 16V12C20.25 10.2051 18.7949 8.75 17 8.75H7Z" fill={primary}/>
<path d="M17.75 14C17.75 14.6904 17.1904 15.25 16.5 15.25C15.8096 15.25 15.25 14.6904 15.25 14C15.25 13.3096 15.8096 12.75 16.5 12.75C17.1904 12.75 17.75 13.3096 17.75 14Z" fill={secondary}/>
    </svg>
  );
}
