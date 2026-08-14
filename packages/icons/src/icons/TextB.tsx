import type { IconProps } from '../types';

export function TextB({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M13 3.25C15.6234 3.25 17.75 5.37665 17.75 8C17.75 10.6234 15.6234 12.75 13 12.75H7C6.58579 12.75 6.25 12.4142 6.25 12V4C6.25 3.58579 6.58579 3.25 7 3.25H13ZM7.75 11.25H13C14.7949 11.25 16.25 9.79493 16.25 8C16.25 6.20507 14.7949 4.75 13 4.75H7.75V11.25Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M15 11.25C17.6234 11.25 19.75 13.3766 19.75 16C19.75 18.6234 17.6234 20.75 15 20.75H7C6.58579 20.75 6.25 20.4142 6.25 20V12C6.25 11.5858 6.58579 11.25 7 11.25H15ZM7.75 19.25H15C16.7949 19.25 18.25 17.7949 18.25 16C18.25 14.2051 16.7949 12.75 15 12.75H7.75V19.25Z" fill={primary}/>
    </svg>
  );
}
