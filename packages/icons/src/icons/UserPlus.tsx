import type { IconProps } from '../types';

export function UserPlus({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M10 4.25C13.1756 4.25 15.75 6.82436 15.75 10C15.75 11.684 15.0257 13.1984 13.8721 14.25H14C16.6234 14.25 18.75 16.3766 18.75 19C18.75 19.4142 18.4142 19.75 18 19.75C17.5858 19.75 17.25 19.4142 17.25 19C17.25 17.2051 15.7949 15.75 14 15.75H6C4.20507 15.75 2.75 17.2051 2.75 19C2.75 19.4142 2.41421 19.75 2 19.75C1.58579 19.75 1.25 19.4142 1.25 19C1.25 16.3766 3.37665 14.25 6 14.25H6.12793C4.97434 13.1984 4.25 11.684 4.25 10C4.25 6.82436 6.82436 4.25 10 4.25ZM10 5.75C7.65279 5.75 5.75 7.65279 5.75 10C5.75 12.3472 7.65279 14.25 10 14.25C12.3472 14.25 14.25 12.3472 14.25 10C14.25 7.65279 12.3472 5.75 10 5.75Z" fill={primary}/>
<path d="M20.5 7.25C20.9142 7.25 21.25 7.58579 21.25 8V9.75H23C23.4142 9.75 23.75 10.0858 23.75 10.5C23.75 10.9142 23.4142 11.25 23 11.25H21.25V13C21.25 13.4142 20.9142 13.75 20.5 13.75C20.0858 13.75 19.75 13.4142 19.75 13V11.25H18C17.5858 11.25 17.25 10.9142 17.25 10.5C17.25 10.0858 17.5858 9.75 18 9.75H19.75V8C19.75 7.58579 20.0858 7.25 20.5 7.25Z" fill={secondary}/>
    </svg>
  );
}
