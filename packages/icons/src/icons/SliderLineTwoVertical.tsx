import type { IconProps } from '../types';

export function SliderLineTwoVertical({
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
      <path d="M8 10.25C8.41421 10.25 8.75 10.5858 8.75 11V21C8.75 21.4142 8.41421 21.75 8 21.75C7.58579 21.75 7.25 21.4142 7.25 21V11C7.25 10.5858 7.58579 10.25 8 10.25Z" fill={primary}/>
<path d="M16 16.25C16.4142 16.25 16.75 16.5858 16.75 17V21C16.75 21.4142 16.4142 21.75 16 21.75C15.5858 21.75 15.25 21.4142 15.25 21V17C15.25 16.5858 15.5858 16.25 16 16.25Z" fill={primary}/>
<path d="M16 2.25C16.4142 2.25 16.75 2.58579 16.75 3V14C16.75 14.4142 16.4142 14.75 16 14.75C15.5858 14.75 15.25 14.4142 15.25 14V3C15.25 2.58579 15.5858 2.25 16 2.25Z" fill={primary}/>
<path d="M8 2.25C8.41421 2.25 8.75 2.58579 8.75 3V8C8.75 8.41421 8.41421 8.75 8 8.75C7.58579 8.75 7.25 8.41421 7.25 8V3C7.25 2.58579 7.58579 2.25 8 2.25Z" fill={primary}/>
<path d="M19 13.25C19.4142 13.25 19.75 13.5858 19.75 14C19.75 14.4142 19.4142 14.75 19 14.75H13C12.5858 14.75 12.25 14.4142 12.25 14C12.25 13.5858 12.5858 13.25 13 13.25H19Z" fill={secondary}/>
<path d="M11 7.25C11.4142 7.25 11.75 7.58579 11.75 8C11.75 8.41421 11.4142 8.75 11 8.75H5C4.58579 8.75 4.25 8.41421 4.25 8C4.25 7.58579 4.58579 7.25 5 7.25H11Z" fill={secondary}/>
    </svg>
  );
}
