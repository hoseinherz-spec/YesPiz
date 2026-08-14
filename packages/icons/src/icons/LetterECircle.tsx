import type { IconProps } from '../types';

export function LetterECircle({
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
<path d="M14.5 6.75C14.9142 6.75 15.25 7.08579 15.25 7.5C15.25 7.91421 14.9142 8.25 14.5 8.25H11C10.3096 8.25 9.75 8.80964 9.75 9.5V11.25H13C13.4142 11.25 13.75 11.5858 13.75 12C13.75 12.4142 13.4142 12.75 13 12.75H9.75V14.5C9.75 15.1904 10.3096 15.75 11 15.75H14.5C14.9142 15.75 15.25 16.0858 15.25 16.5C15.25 16.9142 14.9142 17.25 14.5 17.25H11C9.48122 17.25 8.25 16.0188 8.25 14.5V9.5C8.25 7.98122 9.48122 6.75 11 6.75H14.5Z" fill={secondary}/>
    </svg>
  );
}
