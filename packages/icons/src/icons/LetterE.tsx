import type { IconProps } from '../types';

export function LetterE({
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
      <path d="M15 11.25C15.4142 11.25 15.75 11.5858 15.75 12C15.75 12.4142 15.4142 12.75 15 12.75H7C6.58579 12.75 6.25 12.4142 6.25 12C6.25 11.5858 6.58579 11.25 7 11.25H15Z" fill={secondary}/>
<path d="M17 2.25C17.4142 2.25 17.75 2.58579 17.75 3C17.75 3.41421 17.4142 3.75 17 3.75H11C9.20507 3.75 7.75 5.20507 7.75 7V17C7.75 18.7949 9.20507 20.25 11 20.25H17C17.4142 20.25 17.75 20.5858 17.75 21C17.75 21.4142 17.4142 21.75 17 21.75H11C8.37665 21.75 6.25 19.6234 6.25 17V7C6.25 4.37665 8.37665 2.25 11 2.25H17Z" fill={primary}/>
    </svg>
  );
}
