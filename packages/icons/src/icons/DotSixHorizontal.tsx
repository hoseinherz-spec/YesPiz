import type { IconProps } from '../types';

export function DotSixHorizontal({
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
      <path d="M5 14.25C5.69036 14.25 6.25 14.8096 6.25 15.5C6.25 16.1904 5.69036 16.75 5 16.75C4.30964 16.75 3.75 16.1904 3.75 15.5C3.75 14.8096 4.30964 14.25 5 14.25Z" fill={primary}/>
<path d="M19 14.25C19.6904 14.25 20.25 14.8096 20.25 15.5C20.25 16.1904 19.6904 16.75 19 16.75C18.3096 16.75 17.75 16.1904 17.75 15.5C17.75 14.8096 18.3096 14.25 19 14.25Z" fill={primary}/>
<path d="M5 7.25C5.69036 7.25 6.25 7.80964 6.25 8.5C6.25 9.19036 5.69036 9.75 5 9.75C4.30964 9.75 3.75 9.19036 3.75 8.5C3.75 7.80964 4.30964 7.25 5 7.25Z" fill={primary}/>
<path d="M19 7.25C19.6904 7.25 20.25 7.80964 20.25 8.5C20.25 9.19036 19.6904 9.75 19 9.75C18.3096 9.75 17.75 9.19036 17.75 8.5C17.75 7.80964 18.3096 7.25 19 7.25Z" fill={primary}/>
<path d="M12 14.25C12.6904 14.25 13.25 14.8096 13.25 15.5C13.25 16.1904 12.6904 16.75 12 16.75C11.3096 16.75 10.75 16.1904 10.75 15.5C10.75 14.8096 11.3096 14.25 12 14.25Z" fill={secondary}/>
<path d="M12 7.25C12.6904 7.25 13.25 7.80964 13.25 8.5C13.25 9.19036 12.6904 9.75 12 9.75C11.3096 9.75 10.75 9.19036 10.75 8.5C10.75 7.80964 11.3096 7.25 12 7.25Z" fill={secondary}/>
    </svg>
  );
}
