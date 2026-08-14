import type { IconProps } from '../types';

export function Hourglass2({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M18 2.25C18.4142 2.25 18.75 2.58579 18.75 3V6C18.75 8.61365 17.2636 10.8785 15.0908 12C17.2636 13.1215 18.75 15.3864 18.75 18V21C18.75 21.4142 18.4142 21.75 18 21.75H6C5.58579 21.75 5.25 21.4142 5.25 21V18C5.25 15.3867 6.73589 13.1217 8.9082 12C6.73589 10.8783 5.25 8.61334 5.25 6V3C5.25 2.58579 5.58579 2.25 6 2.25H18ZM12 12.75C9.10051 12.75 6.75 15.1005 6.75 18V20.25H17.25V18C17.25 15.1005 14.8995 12.75 12 12.75ZM6.75 6C6.75 8.89949 9.10051 11.25 12 11.25C14.8995 11.25 17.25 8.8995 17.25 6V3.75H6.75V6Z" fill={primary}/>
<path d="M20 20.25C20.4142 20.25 20.75 20.5858 20.75 21C20.75 21.4142 20.4142 21.75 20 21.75H4C3.58579 21.75 3.25 21.4142 3.25 21C3.25 20.5858 3.58579 20.25 4 20.25H20Z" fill={secondary}/>
<path d="M20 2.25C20.4142 2.25 20.75 2.58579 20.75 3C20.75 3.41421 20.4142 3.75 20 3.75H4C3.58579 3.75 3.25 3.41421 3.25 3C3.25 2.58579 3.58579 2.25 4 2.25H20Z" fill={secondary}/>
    </svg>
  );
}
