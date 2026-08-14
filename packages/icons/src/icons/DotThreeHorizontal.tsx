import type { IconProps } from '../types';

export function DotThreeHorizontal({
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
      <path d="M5 10.75C5.69036 10.75 6.25 11.3096 6.25 12C6.25 12.6904 5.69036 13.25 5 13.25C4.30964 13.25 3.75 12.6904 3.75 12C3.75 11.3096 4.30964 10.75 5 10.75Z" fill={primary}/>
<path d="M19 10.75C19.6904 10.75 20.25 11.3096 20.25 12C20.25 12.6904 19.6904 13.25 19 13.25C18.3096 13.25 17.75 12.6904 17.75 12C17.75 11.3096 18.3096 10.75 19 10.75Z" fill={primary}/>
<rect x="13.25" y="10.75" width="2.5" height="2.5" rx="1.25" transform="rotate(90 13.25 10.75)" fill={secondary}/>
    </svg>
  );
}
