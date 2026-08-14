import type { IconProps } from '../types';

export function LetterF({
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
      <path d="M16 10.25C16.4142 10.25 16.75 10.5858 16.75 11C16.75 11.4142 16.4142 11.75 16 11.75H8C7.58579 11.75 7.25 11.4142 7.25 11C7.25 10.5858 7.58579 10.25 8 10.25H16Z" fill={secondary}/>
<path d="M18 2.25C18.4142 2.25 18.75 2.58579 18.75 3C18.75 3.41421 18.4142 3.75 18 3.75H12C10.2051 3.75 8.75 5.20507 8.75 7V21C8.75 21.4142 8.41421 21.75 8 21.75C7.58579 21.75 7.25 21.4142 7.25 21V7C7.25 4.37665 9.37665 2.25 12 2.25H18Z" fill={primary}/>
    </svg>
  );
}
