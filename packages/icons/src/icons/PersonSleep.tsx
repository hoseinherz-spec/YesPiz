import type { IconProps } from '../types';

export function PersonSleep({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M2 3.25C2.41421 3.25 2.75 3.58579 2.75 4V14.25H11.25V7C11.25 6.80109 11.3291 6.61038 11.4697 6.46973C11.6104 6.32907 11.8011 6.25 12 6.25H15.5996C16.7072 6.25 17.5835 6.24909 18.2881 6.30664C19.0014 6.36492 19.6051 6.48682 20.1562 6.76758C21.05 7.22298 21.777 7.94998 22.2324 8.84375C22.5132 9.39487 22.6351 9.99862 22.6934 10.7119C22.7509 11.4165 22.75 12.2928 22.75 13.4004V19C22.75 19.4142 22.4142 19.75 22 19.75C21.5858 19.75 21.25 19.4142 21.25 19V15.75H2.75V19C2.75 19.4142 2.41421 19.75 2 19.75C1.58579 19.75 1.25 19.4142 1.25 19V4C1.25 3.58579 1.58579 3.25 2 3.25ZM12.75 14.25H21.25V13.4004C21.25 12.268 21.2497 11.4633 21.1982 10.834C21.1475 10.2134 21.0506 9.82889 20.8955 9.52441C20.5839 8.91305 20.087 8.41605 19.4756 8.10449C19.1711 7.94936 18.7866 7.85247 18.166 7.80176C17.5367 7.75035 16.732 7.75 15.5996 7.75H12.75V14.25Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M7 7.25C8.51878 7.25 9.75 8.48122 9.75 10C9.75 11.5188 8.51878 12.75 7 12.75C5.48122 12.75 4.25 11.5188 4.25 10C4.25 8.48122 5.48122 7.25 7 7.25ZM7 8.75C6.30964 8.75 5.75 9.30964 5.75 10C5.75 10.6904 6.30964 11.25 7 11.25C7.69036 11.25 8.25 10.6904 8.25 10C8.25 9.30964 7.69036 8.75 7 8.75Z" fill={secondary}/>
    </svg>
  );
}
