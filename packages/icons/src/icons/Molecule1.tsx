import type { IconProps } from '../types';

export function Molecule1({
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
      <path d="M15.9297 11.3643L12.1797 13.9893L11.3203 12.7607L15.0703 10.1357L15.9297 11.3643Z" fill={secondary}/>
<path d="M16.335 7.3291L15.665 8.6709L11.665 6.6709L12.335 5.3291L16.335 7.3291Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M8 10.25C11.1756 10.25 13.75 12.8244 13.75 16C13.75 19.1756 11.1756 21.75 8 21.75C4.82436 21.75 2.25 19.1756 2.25 16C2.25 12.8244 4.82436 10.25 8 10.25ZM8 11.75C5.65279 11.75 3.75 13.6528 3.75 16C3.75 18.3472 5.65279 20.25 8 20.25C10.3472 20.25 12.25 18.3472 12.25 16C12.25 13.6528 10.3472 11.75 8 11.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M18 5.25C20.0711 5.25 21.75 6.92893 21.75 9C21.75 11.0711 20.0711 12.75 18 12.75C15.9289 12.75 14.25 11.0711 14.25 9C14.25 6.92893 15.9289 5.25 18 5.25ZM18 6.75C16.7574 6.75 15.75 7.75736 15.75 9C15.75 10.2426 16.7574 11.25 18 11.25C19.2426 11.25 20.25 10.2426 20.25 9C20.25 7.75736 19.2426 6.75 18 6.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M9.82812 2.07813C11.3469 2.07813 12.5781 3.30934 12.5781 4.82812C12.5781 6.34691 11.3469 7.57812 9.82812 7.57812C8.30934 7.57812 7.07813 6.34691 7.07812 4.82812C7.07813 3.30934 8.30934 2.07812 9.82812 2.07813ZM9.82812 3.57812C9.13777 3.57812 8.57813 4.13777 8.57812 4.82812C8.57813 5.51848 9.13777 6.07812 9.82812 6.07812C10.5185 6.07812 11.0781 5.51848 11.0781 4.82812C11.0781 4.13777 10.5185 3.57813 9.82812 3.57812Z" fill={primary}/>
    </svg>
  );
}
