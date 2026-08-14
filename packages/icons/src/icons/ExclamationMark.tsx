import type { IconProps } from '../types';

export function ExclamationMark({
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
      <path d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4V14C12.75 14.4142 12.4142 14.75 12 14.75C11.5858 14.75 11.25 14.4142 11.25 14V4C11.25 3.58579 11.5858 3.25 12 3.25Z" fill={primary}/>
<path d="M12 16.75C12.8284 16.75 13.5 17.4216 13.5 18.25C13.5 19.0784 12.8284 19.75 12 19.75C11.1716 19.75 10.5 19.0784 10.5 18.25C10.5 17.4216 11.1716 16.75 12 16.75Z" fill={secondary}/>
    </svg>
  );
}
