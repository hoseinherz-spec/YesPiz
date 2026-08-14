import type { IconProps } from '../types';

export function NumberFive({
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
      <path d="M16 3.25C16.4142 3.25 16.75 3.58579 16.75 4C16.75 4.41421 16.4142 4.75 16 4.75H8.75V11.25H12C14.6234 11.25 16.75 13.3766 16.75 16C16.75 18.6234 14.6234 20.75 12 20.75H8C7.58579 20.75 7.25 20.4142 7.25 20C7.25 19.5858 7.58579 19.25 8 19.25H12C13.7949 19.25 15.25 17.7949 15.25 16C15.25 14.2051 13.7949 12.75 12 12.75H8C7.58579 12.75 7.25 12.4142 7.25 12V4C7.25 3.58579 7.58579 3.25 8 3.25H16Z" fill={primary}/>
    </svg>
  );
}
