import type { IconProps } from '../types';

export function LetterACircle({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M13 6.25C14.5188 6.25 15.75 7.48122 15.75 9V17C15.75 17.4142 15.4142 17.75 15 17.75C14.5858 17.75 14.25 17.4142 14.25 17V14.75H9.75V17C9.75 17.4142 9.41421 17.75 9 17.75C8.58579 17.75 8.25 17.4142 8.25 17V9C8.25 7.48122 9.48122 6.25 11 6.25H13ZM11 7.75C10.3096 7.75 9.75 8.30964 9.75 9V13.25H14.25V9C14.25 8.30964 13.6904 7.75 13 7.75H11Z" fill={secondary}/>
    </svg>
  );
}
