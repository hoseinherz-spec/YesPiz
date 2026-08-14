import type { IconProps } from '../types';

export function Wheat({
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
      <path d="M12 1.25C12.4142 1.25 12.75 1.58579 12.75 2V22C12.75 22.4142 12.4142 22.75 12 22.75C11.5858 22.75 11.25 22.4142 11.25 22V2C11.25 1.58579 11.5858 1.25 12 1.25Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M17 3.25C17.4142 3.25 17.75 3.58579 17.75 4V13C17.75 13.8934 17.7541 14.4497 17.6592 14.9268C17.2844 16.811 15.8111 18.2844 13.9268 18.6592C13.4497 18.7541 12.8934 18.75 12 18.75C11.1067 18.75 10.5504 18.7541 10.0733 18.6592C8.189 18.2844 6.71565 16.811 6.34085 14.9268C6.24595 14.4497 6.25003 13.8934 6.25003 13V4C6.25003 3.5858 6.58582 3.25001 7.00003 3.25C7.41424 3.25 7.75003 3.58579 7.75003 4V5.68945L12 9.93945L16.25 5.68945V4C16.25 3.5858 16.5858 3.25001 17 3.25ZM12 17.0605L7.75003 12.8105V13C7.75003 13.965 7.75376 14.3381 7.81253 14.6338C8.06897 15.923 9.077 16.931 10.3662 17.1875C10.6619 17.2463 11.035 17.25 12 17.25C12.965 17.25 13.3382 17.2463 13.6338 17.1875C14.9231 16.9311 15.9311 15.923 16.1875 14.6338C16.2463 14.3381 16.25 13.965 16.25 13V12.8105L12 17.0605ZM12 12.0605L7.75003 7.81055V10.6895L12 14.9395L16.25 10.6895V7.81055L12 12.0605Z" fill={primary}/>
    </svg>
  );
}
