import type { IconProps } from '../types';

export function ArrowBendUpRight1({
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
      <path d="M19 7.25C19.4142 7.25 19.75 7.58579 19.75 8C19.75 8.41421 19.4142 8.75 19 8.75H10C8.20507 8.75 6.75 10.2051 6.75 12V21C6.75 21.4142 6.41421 21.75 6 21.75C5.58579 21.75 5.25 21.4142 5.25 21V12C5.25 9.37665 7.37665 7.25 10 7.25H19Z" fill={primary}/>
<path d="M14.4697 2.46967C14.7626 2.17678 15.2373 2.17678 15.5302 2.46967L19.1162 6.05561C20.1898 7.12952 20.1899 8.87039 19.1162 9.94428L15.5302 13.5302C15.2373 13.8231 14.7626 13.8231 14.4697 13.5302C14.1768 13.2373 14.1768 12.7626 14.4697 12.4697L18.0556 8.88373C18.5435 8.39563 18.5435 7.60428 18.0556 7.11615L14.4697 3.53022C14.1768 3.23732 14.1768 2.76256 14.4697 2.46967Z" fill={secondary}/>
    </svg>
  );
}
