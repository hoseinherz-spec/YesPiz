import type { IconProps } from '../types';

export function ShoppingCart2({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M1 2.25C2.92808 2.25 4.6216 3.46909 5.25684 5.25H22C22.2247 5.25 22.4376 5.35066 22.5801 5.52441C22.7225 5.69818 22.7794 5.92713 22.7354 6.14746L21.3789 12.9316C20.9348 15.1519 18.9849 16.75 16.7207 16.75H10.1816C7.97004 16.7498 6.05114 15.2233 5.55371 13.0684L3.94336 6.0918C3.62698 4.72107 2.40678 3.75 1 3.75C0.585786 3.75 0.25 3.41421 0.25 3C0.25 2.58579 0.585786 2.25 1 2.25ZM7.01562 12.7305C7.35589 14.205 8.66843 15.2498 10.1816 15.25H16.7207C18.2698 15.25 19.6033 14.1566 19.9072 12.6377L21.085 6.75H5.63477L7.01562 12.7305Z" fill={primary}/>
<path d="M9 18.5C9.82843 18.5 10.5 19.1716 10.5 20C10.5 20.8284 9.82843 21.5 9 21.5C8.17157 21.5 7.5 20.8284 7.5 20C7.5 19.1716 8.17157 18.5 9 18.5Z" fill={secondary}/>
<path d="M18 18.5C18.8284 18.5 19.5 19.1716 19.5 20C19.5 20.8284 18.8284 21.5 18 21.5C17.1716 21.5 16.5 20.8284 16.5 20C16.5 19.1716 17.1716 18.5 18 18.5Z" fill={secondary}/>
    </svg>
  );
}
