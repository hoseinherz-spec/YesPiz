import type { IconProps } from '../types';

export function LetterH({
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
      <path d="M17 2.25C17.4142 2.25 17.75 2.58579 17.75 3V12C17.75 12.4142 17.4142 12.75 17 12.75H7C6.58579 12.75 6.25 12.4142 6.25 12V3C6.25 2.58579 6.58579 2.25 7 2.25C7.41421 2.25 7.75 2.58579 7.75 3V11.25H16.25V3C16.25 2.58579 16.5858 2.25 17 2.25Z" fill={primary}/>
<path d="M17 11.25C17.4142 11.25 17.75 11.5858 17.75 12V21C17.75 21.4142 17.4142 21.75 17 21.75C16.5858 21.75 16.25 21.4142 16.25 21V12.75H7.75V21C7.75 21.4142 7.41421 21.75 7 21.75C6.58579 21.75 6.25 21.4142 6.25 21V12C6.25 11.5858 6.58579 11.25 7 11.25H17Z" fill={secondary}/>
    </svg>
  );
}
