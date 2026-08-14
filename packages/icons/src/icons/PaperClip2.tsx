import type { IconProps } from '../types';

export function PaperClip2({
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
      <path d="M18 6.25C20.6234 6.25 22.75 8.37665 22.75 11V13C22.75 15.6234 20.6234 17.75 18 17.75H4.5C2.70507 17.75 1.25 16.2949 1.25 14.5V13.5C1.25 11.7051 2.70507 10.25 4.5 10.25H16C16.4142 10.25 16.75 10.5858 16.75 11C16.75 11.4142 16.4142 11.75 16 11.75H4.5C3.5335 11.75 2.75 12.5335 2.75 13.5V14.5C2.75 15.4665 3.5335 16.25 4.5 16.25H18C19.7949 16.25 21.25 14.7949 21.25 13V11C21.25 9.20507 19.7949 7.75 18 7.75H7C6.58579 7.75 6.25 7.41421 6.25 7C6.25 6.58579 6.58579 6.25 7 6.25H18Z" fill={primary}/>
    </svg>
  );
}
