import type { IconProps } from '../types';

export function Wine({
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
      <path d="M17 6.25C17.4142 6.25 17.75 6.58579 17.75 7C17.75 7.41421 17.4142 7.75 17 7.75H7C6.58579 7.75 6.25 7.41421 6.25 7C6.25 6.58579 6.58579 6.25 7 6.25H17Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M17 2.25C17.4142 2.25 17.75 2.58579 17.75 3V10C17.75 10.8934 17.7541 11.4497 17.6592 11.9268C17.2844 13.811 15.8111 15.2844 13.9268 15.6592C13.5995 15.7243 13.235 15.7409 12.75 15.7461V20.25H16C16.4142 20.25 16.75 20.5858 16.75 21C16.75 21.4142 16.4142 21.75 16 21.75H8.00003C7.58582 21.75 7.25003 21.4142 7.25003 21C7.25003 20.5858 7.58582 20.25 8.00003 20.25H11.25V15.7461C10.7651 15.7409 10.4005 15.7243 10.0733 15.6592C8.189 15.2844 6.71565 13.811 6.34085 11.9268C6.24595 11.4497 6.25003 10.8934 6.25003 10V3C6.25003 2.5858 6.58582 2.25001 7.00003 2.25H17ZM7.75003 10C7.75003 10.965 7.75376 11.3381 7.81253 11.6338C8.06897 12.923 9.077 13.931 10.3662 14.1875C10.6619 14.2463 11.035 14.25 12 14.25C12.965 14.25 13.3382 14.2463 13.6338 14.1875C14.9231 13.9311 15.9311 12.923 16.1875 11.6338C16.2463 11.3381 16.25 10.965 16.25 10V3.75H7.75003V10Z" fill={primary}/>
    </svg>
  );
}
