import type { IconProps } from '../types';

export function HardDrive({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M17 6.25C19.6234 6.25 21.75 8.37665 21.75 11V13C21.75 15.6234 19.6234 17.75 17 17.75H7C4.37665 17.75 2.25 15.6234 2.25 13V11C2.25 8.37665 4.37665 6.25 7 6.25H17ZM7 7.75C5.20507 7.75 3.75 9.20507 3.75 11V13C3.75 14.7949 5.20507 16.25 7 16.25H17C18.7949 16.25 20.25 14.7949 20.25 13V11C20.25 9.20507 18.7949 7.75 17 7.75H7Z" fill={primary}/>
<circle cx="16.5" cy="12" r="1.25" fill={secondary}/>
    </svg>
  );
}
