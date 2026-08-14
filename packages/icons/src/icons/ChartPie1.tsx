import type { IconProps } from '../types';

export function ChartPie1({
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
      <path d="M17.4697 5.46967C17.7626 5.17678 18.2373 5.17678 18.5302 5.46967C18.8231 5.76257 18.8231 6.23734 18.5302 6.53022L12.5302 12.5302C12.2373 12.8231 11.7626 12.8231 11.4697 12.5302C11.1768 12.2373 11.1768 11.7626 11.4697 11.4697L17.4697 5.46967Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM11.25 3.78516C7.04519 4.16414 3.75 7.69651 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C14.0081 20.25 15.8477 19.5314 17.2783 18.3389L11.4697 12.5303C11.3291 12.3896 11.25 12.1989 11.25 12V3.78516ZM12.75 11.6895L18.3389 17.2783C19.5314 15.8477 20.25 14.0081 20.25 12C20.25 7.69651 16.9548 4.16414 12.75 3.78516V11.6895Z" fill={primary}/>
    </svg>
  );
}
