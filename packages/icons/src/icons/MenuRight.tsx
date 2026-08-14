import type { IconProps } from '../types';

export function MenuRight({
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
      <path d="M22 17.25C22.4142 17.25 22.75 17.5858 22.75 18C22.75 18.4142 22.4142 18.75 22 18.75H2C1.58579 18.75 1.25 18.4142 1.25 18C1.25 17.5858 1.58579 17.25 2 17.25H22Z" fill={primary}/>
<path d="M22 5.25C22.4142 5.25 22.75 5.58579 22.75 6C22.75 6.41421 22.4142 6.75 22 6.75H2C1.58579 6.75 1.25 6.41421 1.25 6C1.25 5.58579 1.58579 5.25 2 5.25H22Z" fill={primary}/>
<path d="M22 11.25C22.4142 11.25 22.75 11.5858 22.75 12C22.75 12.4142 22.4142 12.75 22 12.75H8C7.58579 12.75 7.25 12.4142 7.25 12C7.25 11.5858 7.58579 11.25 8 11.25H22Z" fill={secondary}/>
    </svg>
  );
}
