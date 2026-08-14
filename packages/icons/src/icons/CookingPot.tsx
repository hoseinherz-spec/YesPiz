import type { IconProps } from '../types';

export function CookingPot({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M13 3.25C14.5188 3.25 15.75 4.48122 15.75 6V6.25H20C20.4142 6.25 20.75 6.58579 20.75 7C20.75 7.41421 20.4142 7.75 20 7.75H4C3.58579 7.75 3.25 7.41421 3.25 7C3.25 6.58579 3.58579 6.25 4 6.25H8.25V6C8.25 4.48122 9.48122 3.25 11 3.25H13ZM11 4.75C10.3096 4.75 9.75 5.30964 9.75 6V6.25H14.25V6C14.25 5.30964 13.6904 4.75 13 4.75H11Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M20 9.25C20.4142 9.25 20.75 9.58579 20.75 10V16C20.75 18.6234 18.6234 20.75 16 20.75H8C5.37665 20.75 3.25 18.6234 3.25 16V10C3.25 9.58579 3.58579 9.25 4 9.25H20ZM4.75 16C4.75 17.7949 6.20507 19.25 8 19.25H16C17.7949 19.25 19.25 17.7949 19.25 16V10.75H4.75V16Z" fill={primary}/>
    </svg>
  );
}
