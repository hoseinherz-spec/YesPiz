import type { IconProps } from '../types';

export function TextIItalic({
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
      <path d="M13.279 4.79372C13.3929 4.39553 13.8076 4.16529 14.2058 4.27908C14.6038 4.39303 14.8342 4.80769 14.7204 5.20583L10.7204 19.2058C10.6066 19.6039 10.1918 19.8341 9.79369 19.7205C9.39554 19.6066 9.16535 19.1919 9.27904 18.7937L13.279 4.79372Z" fill={secondary}/>
<path d="M15 18.25C15.4142 18.25 15.75 18.5858 15.75 19C15.75 19.4142 15.4142 19.75 15 19.75H5C4.58579 19.75 4.25 19.4142 4.25 19C4.25 18.5858 4.58579 18.25 5 18.25H15Z" fill={primary}/>
<path d="M19 4.25C19.4142 4.25 19.75 4.58579 19.75 5C19.75 5.41421 19.4142 5.75 19 5.75H9C8.58579 5.75 8.25 5.41421 8.25 5C8.25 4.58579 8.58579 4.25 9 4.25H19Z" fill={primary}/>
    </svg>
  );
}
