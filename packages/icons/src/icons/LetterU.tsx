import type { IconProps } from '../types';

export function LetterU({
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
      <path d="M17 2.25C17.4142 2.25 17.75 2.58579 17.75 3V17C17.75 19.6234 15.6234 21.75 13 21.75H11C8.37665 21.75 6.25 19.6234 6.25 17V3C6.25 2.58579 6.58579 2.25 7 2.25C7.41421 2.25 7.75 2.58579 7.75 3V17C7.75 18.7949 9.20507 20.25 11 20.25H13C14.7949 20.25 16.25 18.7949 16.25 17V3C16.25 2.58579 16.5858 2.25 17 2.25Z" fill={primary}/>
    </svg>
  );
}
