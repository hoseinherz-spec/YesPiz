import type { IconProps } from '../types';

export function ChartPie2({
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
      <path d="M11.4697 11.4697C11.7626 11.1768 12.2373 11.1768 12.5302 11.4697C12.8231 11.7626 12.8231 12.2373 12.5302 12.5302L6.53022 18.5302C6.23734 18.8231 5.76257 18.8231 5.46967 18.5302C5.17678 18.2373 5.17678 17.7626 5.46967 17.4697L11.4697 11.4697Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM11.25 3.78516C7.04519 4.16414 3.75 7.69651 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.3035 20.25 19.8348 16.9548 20.2139 12.75H12C11.5858 12.75 11.25 12.4142 11.25 12V3.78516ZM12.75 11.25H20.2139C19.8571 7.2923 16.7077 4.14187 12.75 3.78516V11.25Z" fill={primary}/>
    </svg>
  );
}
