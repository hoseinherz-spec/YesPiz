import type { IconProps } from '../types';

export function DotThreeVertical({
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
      <path d="M12 17.75C12.6904 17.75 13.25 18.3096 13.25 19C13.25 19.6904 12.6904 20.25 12 20.25C11.3096 20.25 10.75 19.6904 10.75 19C10.75 18.3096 11.3096 17.75 12 17.75Z" fill={primary}/>
<path d="M12 3.75C12.6904 3.75 13.25 4.30964 13.25 5C13.25 5.69036 12.6904 6.25 12 6.25C11.3096 6.25 10.75 5.69036 10.75 5C10.75 4.30964 11.3096 3.75 12 3.75Z" fill={primary}/>
<rect x="10.75" y="10.75" width="2.5" height="2.5" rx="1.25" fill={secondary}/>
    </svg>
  );
}
