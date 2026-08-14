import type { IconProps } from '../types';

export function NumberThree({
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
      <path d="M13 3.25C15.6234 3.25 17.75 5.37665 17.75 8C17.75 10.6234 15.6234 12.75 13 12.75H11C10.5858 12.75 10.25 12.4142 10.25 12C10.25 11.5858 10.5858 11.25 11 11.25H13C14.7949 11.25 16.25 9.79493 16.25 8C16.25 6.20507 14.7949 4.75 13 4.75H7C6.58579 4.75 6.25 4.41421 6.25 4C6.25 3.58579 6.58579 3.25 7 3.25H13Z" fill={secondary}/>
<path d="M13 11.25C15.6234 11.25 17.75 13.3766 17.75 16C17.75 18.6234 15.6234 20.75 13 20.75H7C6.58579 20.75 6.25 20.4142 6.25 20C6.25 19.5858 6.58579 19.25 7 19.25H13C14.7949 19.25 16.25 17.7949 16.25 16C16.25 14.2051 14.7949 12.75 13 12.75H11C10.5858 12.75 10.25 12.4142 10.25 12C10.25 11.5858 10.5858 11.25 11 11.25H13Z" fill={primary}/>
    </svg>
  );
}
