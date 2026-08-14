import type { IconProps } from '../types';

export function Gift({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M14 1.25C15.5188 1.25 16.75 2.48122 16.75 4C16.75 4.45058 16.6394 4.87468 16.4473 5.25H20C20.9665 5.25 21.75 6.0335 21.75 7V9C21.75 9.9665 20.9665 10.75 20 10.75H19.75V21C19.75 21.4142 19.4142 21.75 19 21.75H5C4.58579 21.75 4.25 21.4142 4.25 21V10.75H4C3.0335 10.75 2.25 9.9665 2.25 9V7C2.25 6.0335 3.0335 5.25 4 5.25H7.55273C7.36065 4.87468 7.25 4.45058 7.25 4C7.25 2.48122 8.48122 1.25 10 1.25C10.789 1.25 11.4985 1.58399 12 2.11621C12.5015 1.58399 13.211 1.25 14 1.25ZM5.75 20.25H18.25V10.75H5.75V20.25ZM4 6.75C3.86193 6.75 3.75 6.86193 3.75 7V9C3.75 9.13807 3.86193 9.25 4 9.25H20C20.1381 9.25 20.25 9.13807 20.25 9V7C20.25 6.86193 20.1381 6.75 20 6.75H4ZM10 2.75C9.30964 2.75 8.75 3.30964 8.75 4C8.75 4.69036 9.30964 5.25 10 5.25C10.6904 5.25 11.25 4.69036 11.25 4C11.25 3.30964 10.6904 2.75 10 2.75ZM14 2.75C13.3096 2.75 12.75 3.30964 12.75 4C12.75 4.69036 13.3096 5.25 14 5.25C14.6904 5.25 15.25 4.69036 15.25 4C15.25 3.30964 14.6904 2.75 14 2.75Z" fill={primary}/>
<path d="M12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V21C12.75 21.4142 12.4142 21.75 12 21.75C11.5858 21.75 11.25 21.4142 11.25 21V6C11.25 5.58579 11.5858 5.25 12 5.25Z" fill={secondary}/>
    </svg>
  );
}
