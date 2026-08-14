import type { IconProps } from '../types';

export function CurrencyInr({
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
      <path d="M20 3.25C20.4142 3.25 20.75 3.58579 20.75 4C20.75 4.41421 20.4142 4.75 20 4.75H15.1719C16.1449 5.70296 16.75 7.03044 16.75 8.5C16.75 11.3994 14.3994 13.7499 11.5 13.75H8.81055L16.0605 21H13.9395L6.46973 13.5303C6.2554 13.3158 6.19069 12.993 6.30664 12.7129C6.42271 12.4328 6.69681 12.2501 7 12.25H11.5C13.571 12.2499 15.25 10.571 15.25 8.5C15.25 6.42901 13.571 4.75013 11.5 4.75H6C5.58579 4.75 5.25 4.41421 5.25 4C5.25 3.58579 5.58579 3.25 6 3.25H20Z" fill={primary}/>
<path d="M20 7.25C20.4142 7.25 20.75 7.58579 20.75 8C20.75 8.41421 20.4142 8.75 20 8.75H6C5.58579 8.75 5.25 8.41421 5.25 8C5.25 7.58579 5.58579 7.25 6 7.25H20Z" fill={secondary}/>
    </svg>
  );
}
