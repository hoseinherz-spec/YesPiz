import type { IconProps } from '../types';

export function QuestionMarkCircle({
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
<path d="M12 15.25C12.6904 15.25 13.25 15.8096 13.25 16.5C13.25 17.1904 12.6904 17.75 12 17.75C11.3096 17.75 10.75 17.1904 10.75 16.5C10.75 15.8096 11.3096 15.25 12 15.25Z" fill={secondary}/>
<path d="M12.6758 6.25C14.3735 6.25018 15.7498 7.62646 15.75 9.32422V9.41895C15.75 10.686 14.9393 11.8112 13.7373 12.2119L13.6602 12.2373C13.1166 12.4185 12.75 12.9271 12.75 13.5C12.75 13.9142 12.4142 14.25 12 14.25C11.5858 14.25 11.25 13.9142 11.25 13.5C11.25 12.2815 12.0297 11.1999 13.1855 10.8145L13.2627 10.7881C13.8522 10.5916 14.25 10.0403 14.25 9.41895V9.32422C14.2498 8.45488 13.5451 7.75018 12.6758 7.75H11C10.3096 7.75 9.75 8.30964 9.75 9C9.75 9.41421 9.41421 9.75 9 9.75C8.58579 9.75 8.25 9.41421 8.25 9C8.25 7.48122 9.48122 6.25 11 6.25H12.6758Z" fill={secondary}/>
    </svg>
  );
}
