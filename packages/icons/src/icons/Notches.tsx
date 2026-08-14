import type { IconProps } from '../types';

export function Notches({
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
      <path d="M18.4697 2.46967C18.7626 2.17678 19.2373 2.17678 19.5302 2.46967C19.8231 2.76257 19.8231 3.23734 19.5302 3.53022L3.53022 19.5302C3.23734 19.8231 2.76257 19.8231 2.46967 19.5302C2.17678 19.2373 2.17678 18.7626 2.46967 18.4697L18.4697 2.46967Z" fill={primary}/>
<path d="M19.4697 9.46967C19.7626 9.17678 20.2373 9.17678 20.5302 9.46967C20.8231 9.76257 20.8231 10.2373 20.5302 10.5302L10.5302 20.5302C10.2373 20.8231 9.76257 20.8231 9.46967 20.5302C9.17678 20.2373 9.17678 19.7626 9.46967 19.4697L19.4697 9.46967Z" fill={secondary}/>
    </svg>
  );
}
