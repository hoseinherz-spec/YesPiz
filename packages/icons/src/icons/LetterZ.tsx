import type { IconProps } from '../types';

export function LetterZ({
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
      <path d="M16.9551 2.25C18.4113 2.25 19.2307 3.92472 18.3369 5.07422L6.84766 19.8467C6.71993 20.0109 6.83688 20.25 7.04492 20.25H18C18.4142 20.25 18.75 20.5858 18.75 21C18.75 21.4142 18.4142 21.75 18 21.75H7.04492C5.58875 21.75 4.76928 20.0753 5.66309 18.9258L17.1523 4.15332C17.2801 3.98911 17.1631 3.75 16.9551 3.75H6C5.58579 3.75 5.25 3.41421 5.25 3C5.25 2.58579 5.58579 2.25 6 2.25H16.9551Z" fill={primary}/>
    </svg>
  );
}
