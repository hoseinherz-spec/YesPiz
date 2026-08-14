import type { IconProps } from '../types';

export function Volleyball({
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
      <path d="M16.375 15.2275L7.375 20.4238L6.625 19.125L15.625 13.9287L16.375 15.2275Z" fill={secondary}/>
<path d="M8.25 14.5H6.75V4H8.25V14.5Z" fill={secondary}/>
<path d="M21.0938 11.3848L20.3438 12.6836L11.625 7.64941L12.375 6.35059L21.0938 11.3848Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM5.26074 16.7559C6.75468 18.869 9.21528 20.25 12 20.25C14.7845 20.25 17.2443 18.8687 18.7383 16.7559L12 12.8652L5.26074 16.7559ZM11.25 3.78516C7.04519 4.16414 3.75 7.69651 3.75 12C3.75 13.2352 4.0233 14.406 4.50977 15.458L11.25 11.5664V3.78516ZM12.75 11.5664L19.4893 15.458C19.9758 14.4059 20.25 13.2353 20.25 12C20.25 7.69651 16.9548 4.16414 12.75 3.78516V11.5664Z" fill={primary}/>
    </svg>
  );
}
