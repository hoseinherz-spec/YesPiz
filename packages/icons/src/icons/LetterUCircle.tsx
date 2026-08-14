import type { IconProps } from '../types';

export function LetterUCircle({
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
<path d="M14.5 6.75C14.9142 6.75 15.25 7.08579 15.25 7.5V14.5C15.25 16.0188 14.0188 17.25 12.5 17.25H11.5C9.98122 17.25 8.75 16.0188 8.75 14.5V7.5C8.75 7.08579 9.08579 6.75 9.5 6.75C9.91421 6.75 10.25 7.08579 10.25 7.5V14.5C10.25 15.1904 10.8096 15.75 11.5 15.75H12.5C13.1904 15.75 13.75 15.1904 13.75 14.5V7.5C13.75 7.08579 14.0858 6.75 14.5 6.75Z" fill={secondary}/>
    </svg>
  );
}
