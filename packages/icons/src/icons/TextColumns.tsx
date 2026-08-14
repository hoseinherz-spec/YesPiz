import type { IconProps } from '../types';

export function TextColumns({
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
      <path d="M10 13.25C10.4142 13.25 10.75 13.5858 10.75 14C10.75 14.4142 10.4142 14.75 10 14.75H3C2.58579 14.75 2.25 14.4142 2.25 14C2.25 13.5858 2.58579 13.25 3 13.25H10Z" fill={secondary}/>
<path d="M21 13.25C21.4142 13.25 21.75 13.5858 21.75 14C21.75 14.4142 21.4142 14.75 21 14.75H14C13.5858 14.75 13.25 14.4142 13.25 14C13.25 13.5858 13.5858 13.25 14 13.25H21Z" fill={secondary}/>
<path d="M10 5.25C10.4142 5.25 10.75 5.58579 10.75 6C10.75 6.41421 10.4142 6.75 10 6.75H3C2.58579 6.75 2.25 6.41421 2.25 6C2.25 5.58579 2.58579 5.25 3 5.25H10Z" fill={secondary}/>
<path d="M21 5.25C21.4142 5.25 21.75 5.58579 21.75 6C21.75 6.41421 21.4142 6.75 21 6.75H14C13.5858 6.75 13.25 6.41421 13.25 6C13.25 5.58579 13.5858 5.25 14 5.25H21Z" fill={secondary}/>
<path d="M10 17.25C10.4142 17.25 10.75 17.5858 10.75 18C10.75 18.4142 10.4142 18.75 10 18.75H3C2.58579 18.75 2.25 18.4142 2.25 18C2.25 17.5858 2.58579 17.25 3 17.25H10Z" fill={primary}/>
<path d="M21 17.25C21.4142 17.25 21.75 17.5858 21.75 18C21.75 18.4142 21.4142 18.75 21 18.75H14C13.5858 18.75 13.25 18.4142 13.25 18C13.25 17.5858 13.5858 17.25 14 17.25H21Z" fill={primary}/>
<path d="M10 9.25C10.4142 9.25 10.75 9.58579 10.75 10C10.75 10.4142 10.4142 10.75 10 10.75H3C2.58579 10.75 2.25 10.4142 2.25 10C2.25 9.58579 2.58579 9.25 3 9.25H10Z" fill={primary}/>
<path d="M21 9.25C21.4142 9.25 21.75 9.58579 21.75 10C21.75 10.4142 21.4142 10.75 21 10.75H14C13.5858 10.75 13.25 10.4142 13.25 10C13.25 9.58579 13.5858 9.25 14 9.25H21Z" fill={primary}/>
    </svg>
  );
}
