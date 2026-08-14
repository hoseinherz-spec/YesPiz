import type { IconProps } from '../types';

export function LetterY({
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
      <path d="M6 2.25C6.41421 2.25 6.75 2.58579 6.75 3V3.34277C6.75 4.20473 7.09266 5.03211 7.70215 5.6416L11.3584 9.29785C12.2492 10.1886 12.75 11.3974 12.75 12.6572V21C12.75 21.4142 12.4142 21.75 12 21.75C11.5858 21.75 11.25 21.4142 11.25 21V12.6572C11.25 11.7953 10.9073 10.9679 10.2979 10.3584L6.6416 6.70215C5.7508 5.81135 5.25 4.60255 5.25 3.34277V3C5.25 2.58579 5.58579 2.25 6 2.25Z" fill={secondary}/>
<path d="M18 2.25C18.4142 2.25 18.75 2.58579 18.75 3V3.34277C18.75 4.60255 18.2492 5.81135 17.3584 6.70215L13.7021 10.3584C13.0927 10.9679 12.75 11.7953 12.75 12.6572V21C12.75 21.4142 12.4142 21.75 12 21.75C11.5858 21.75 11.25 21.4142 11.25 21V12.6572C11.25 11.3974 11.7508 10.1886 12.6416 9.29785L16.2979 5.6416C16.9073 5.03211 17.25 4.20473 17.25 3.34277V3C17.25 2.58579 17.5858 2.25 18 2.25Z" fill={primary}/>
    </svg>
  );
}
