import type { IconProps } from '../types';

export function NumberSevenCircle({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill={primary}/>
<path d="M12.7529 7.25C13.8725 7.25 14.7048 8.28698 14.4619 9.37988L12.7324 17.1631C12.6424 17.5673 12.2412 17.8223 11.8369 17.7324C11.4327 17.6424 11.1777 17.2412 11.2676 16.8369L12.9971 9.05469C13.0318 8.89856 12.9129 8.75 12.7529 8.75H9.5C9.08579 8.75 8.75 8.41421 8.75 8C8.75 7.58579 9.08579 7.25 9.5 7.25H12.7529Z" fill={secondary}/>
    </svg>
  );
}
