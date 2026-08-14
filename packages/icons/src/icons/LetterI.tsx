import type { IconProps } from '../types';

export function LetterI({
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
      <path d="M16 2.25C16.4142 2.25 16.75 2.58579 16.75 3C16.75 3.41421 16.4142 3.75 16 3.75H12.75V20.25H16C16.4142 20.25 16.75 20.5858 16.75 21C16.75 21.4142 16.4142 21.75 16 21.75H8C7.58579 21.75 7.25 21.4142 7.25 21C7.25 20.5858 7.58579 20.25 8 20.25H11.25V3.75H8C7.58579 3.75 7.25 3.41421 7.25 3C7.25 2.58579 7.58579 2.25 8 2.25H16Z" fill={primary}/>
    </svg>
  );
}
