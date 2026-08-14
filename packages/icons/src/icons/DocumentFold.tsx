import type { IconProps } from '../types';

export function DocumentFold({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M20 2.25C20.4142 2.25 20.75 2.58579 20.75 3V19C20.75 20.4926 19.5607 21.7037 18.0781 21.7451C18.0524 21.7478 18.0264 21.75 18 21.75H5C3.48122 21.75 2.25 20.5188 2.25 19V17C2.25 16.5858 2.58579 16.25 3 16.25H5.25V3C5.25 2.58579 5.58579 2.25 6 2.25H20ZM3.75 19C3.75 19.6904 4.30964 20.25 5 20.25H15.5527C15.3606 19.8747 15.25 19.4506 15.25 19V17.75H3.75V19ZM6.75 16.25H16C16.4142 16.25 16.75 16.5858 16.75 17V19C16.75 19.6904 17.3096 20.25 18 20.25C18.6904 20.25 19.25 19.6904 19.25 19V3.75H6.75V16.25Z" fill={primary}/>
<path d="M13 11.25C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H9C8.58579 12.75 8.25 12.4142 8.25 12C8.25 11.5858 8.58579 11.25 9 11.25H13Z" fill={secondary}/>
<path d="M17 7.25C17.4142 7.25 17.75 7.58579 17.75 8C17.75 8.41421 17.4142 8.75 17 8.75H9C8.58579 8.75 8.25 8.41421 8.25 8C8.25 7.58579 8.58579 7.25 9 7.25H17Z" fill={secondary}/>
    </svg>
  );
}
