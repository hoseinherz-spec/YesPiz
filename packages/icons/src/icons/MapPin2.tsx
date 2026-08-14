import type { IconProps } from '../types';

export function MapPin2({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 6.25C13.5188 6.25 14.75 7.48122 14.75 9C14.75 10.5188 13.5188 11.75 12 11.75C10.4812 11.75 9.25 10.5188 9.25 9C9.25 7.48122 10.4812 6.25 12 6.25ZM12 7.75C11.3096 7.75 10.75 8.30964 10.75 9C10.75 9.69036 11.3096 10.25 12 10.25C12.6904 10.25 13.25 9.69036 13.25 9C13.25 8.30964 12.6904 7.75 12 7.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C15.7279 2.25 18.75 5.27208 18.75 9C18.75 11.1197 17.9079 13.1525 16.4092 14.6514L12.5303 18.5303C12.2374 18.8232 11.7626 18.8232 11.4697 18.5303L7.59082 14.6514C6.09205 13.1525 5.25 11.1197 5.25 9C5.25 5.27208 8.27208 2.25 12 2.25ZM12 3.75C9.10051 3.75 6.75 6.10051 6.75 9C6.75 10.7218 7.4339 12.3732 8.65137 13.5908L12 16.9395L15.3486 13.5908C16.5661 12.3732 17.25 10.7218 17.25 9C17.25 6.10051 14.8995 3.75 12 3.75Z" fill={primary}/>
<path d="M18 20.25C18.4142 20.25 18.75 20.5858 18.75 21C18.75 21.4142 18.4142 21.75 18 21.75H6C5.58579 21.75 5.25 21.4142 5.25 21C5.25 20.5858 5.58579 20.25 6 20.25H18Z" fill={secondary}/>
    </svg>
  );
}
