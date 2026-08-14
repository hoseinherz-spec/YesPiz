import type { IconProps } from '../types';

export function LetterICircle({
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
<path d="M14.5 6.75C14.9142 6.75 15.25 7.08579 15.25 7.5C15.25 7.91421 14.9142 8.25 14.5 8.25H12.75V15.75H14.5C14.9142 15.75 15.25 16.0858 15.25 16.5C15.25 16.9142 14.9142 17.25 14.5 17.25H9.5C9.08579 17.25 8.75 16.9142 8.75 16.5C8.75 16.0858 9.08579 15.75 9.5 15.75H11.25V8.25H9.5C9.08579 8.25 8.75 7.91421 8.75 7.5C8.75 7.08579 9.08579 6.75 9.5 6.75H14.5Z" fill={secondary}/>
    </svg>
  );
}
