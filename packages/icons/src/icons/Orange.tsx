import type { IconProps } from '../types';

export function Orange({
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
      <path d="M16 2.25C16.4142 2.25 16.75 2.58579 16.75 3C16.75 3.41421 16.4142 3.75 16 3.75C14.2051 3.75 12.75 5.20507 12.75 7C12.75 7.41421 12.4142 7.75 12 7.75C11.5858 7.75 11.25 7.41421 11.25 7C11.25 4.37665 13.3766 2.25 16 2.25Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M9 2.25C11.0711 2.25 12.75 3.92893 12.75 6V6.28613C16.6783 6.66337 19.75 9.97282 19.75 14C19.75 18.2802 16.2802 21.75 12 21.75C7.71979 21.75 4.25 18.2802 4.25 14C4.25 10.8921 6.08 8.21279 8.7207 6.97754C7.82669 6.29214 7.25 5.21355 7.25 4V3C7.25 2.58579 7.58579 2.25 8 2.25H9ZM12 7.75C8.54822 7.75 5.75 10.5482 5.75 14C5.75 17.4518 8.54822 20.25 12 20.25C15.4518 20.25 18.25 17.4518 18.25 14C18.25 10.5482 15.4518 7.75 12 7.75ZM8.75 4C8.75 5.24264 9.75736 6.25 11 6.25H11.25V6C11.25 4.75736 10.2426 3.75 9 3.75H8.75V4Z" fill={primary}/>
    </svg>
  );
}
