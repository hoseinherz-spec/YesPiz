import type { IconProps } from '../types';

export function Whistle({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M4.5 4.25C5.74264 4.25 6.75 5.25736 6.75 6.5C6.75 6.54598 6.74491 6.59142 6.74219 6.63672C7.44813 6.38622 8.20817 6.25 9 6.25H21C21.4142 6.25 21.75 6.58579 21.75 7V13C21.75 13.4142 21.4142 13.75 21 13.75H15.707C15.3339 17.1249 12.4743 19.75 9 19.75C5.27208 19.75 2.25 16.7279 2.25 13C2.25 11.3426 2.84777 9.82519 3.83887 8.65039C2.919 8.36792 2.25 7.51247 2.25 6.5C2.25 5.25736 3.25736 4.25 4.5 4.25ZM9 7.75C6.10051 7.75 3.75 10.1005 3.75 13C3.75 15.8995 6.10051 18.25 9 18.25C11.8995 18.25 14.25 15.8995 14.25 13C14.25 12.5858 14.5858 12.25 15 12.25H20.25V7.75H9ZM4.5 5.75C4.08579 5.75 3.75 6.08579 3.75 6.5C3.75 6.91421 4.08579 7.25 4.5 7.25C4.91421 7.25 5.25 6.91421 5.25 6.5C5.25 6.08579 4.91421 5.75 4.5 5.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M9 10.25C10.5188 10.25 11.75 11.4812 11.75 13C11.75 14.5188 10.5188 15.75 9 15.75C7.48122 15.75 6.25 14.5188 6.25 13C6.25 11.4812 7.48122 10.25 9 10.25ZM9 11.75C8.30964 11.75 7.75 12.3096 7.75 13C7.75 13.6904 8.30964 14.25 9 14.25C9.69036 14.25 10.25 13.6904 10.25 13C10.25 12.3096 9.69036 11.75 9 11.75Z" fill={secondary}/>
    </svg>
  );
}
