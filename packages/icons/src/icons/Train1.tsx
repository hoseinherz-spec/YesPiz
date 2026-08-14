import type { IconProps } from '../types';

export function Train1({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M16 2.25C18.0711 2.25 19.75 3.92893 19.75 6V14C19.75 16.3681 18.0169 18.3298 15.75 18.6895L19.0605 22H16.9395L13.6895 18.75H10.3105L7.06055 22H4.93945L8.24902 18.6895C5.98263 18.3294 4.25 16.3677 4.25 14V6C4.25 3.92893 5.92893 2.25 8 2.25H16ZM5.75 14C5.75 15.7949 7.20507 17.25 9 17.25H15C16.7949 17.25 18.25 15.7949 18.25 14V11.75H5.75V14ZM5.75 10.25H11.25V6.75H5.75V10.25ZM12.75 10.25H18.25V6.75H12.75V10.25ZM8 3.75C7.02067 3.75 6.18999 4.37657 5.88086 5.25H18.1191C17.81 4.37657 16.9793 3.75 16 3.75H8Z" fill={primary}/>
<path d="M8.5 13.25C9.19036 13.25 9.75 13.8096 9.75 14.5C9.75 15.1904 9.19036 15.75 8.5 15.75C7.80964 15.75 7.25 15.1904 7.25 14.5C7.25 13.8096 7.80964 13.25 8.5 13.25Z" fill={secondary}/>
<path d="M15.5 13.25C16.1904 13.25 16.75 13.8096 16.75 14.5C16.75 15.1904 16.1904 15.75 15.5 15.75C14.8096 15.75 14.25 15.1904 14.25 14.5C14.25 13.8096 14.8096 13.25 15.5 13.25Z" fill={secondary}/>
    </svg>
  );
}
