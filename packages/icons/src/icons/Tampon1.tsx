import type { IconProps } from '../types';

export function Tampon1({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M7 2.25C9.07107 2.25 10.75 3.92893 10.75 6V15C10.75 15.4142 10.4142 15.75 10 15.75H9.75V16C9.75 17.2264 8.94665 18.2636 7.83789 18.6182C8.10665 19.56 8.97192 20.25 10 20.25H11C12.7949 20.25 14.25 18.7949 14.25 17V9.5C14.25 7.70507 15.7051 6.25 17.5 6.25C19.2949 6.25 20.75 7.70507 20.75 9.5V17C20.75 17.4142 20.4142 17.75 20 17.75C19.5858 17.75 19.25 17.4142 19.25 17V9.5C19.25 8.5335 18.4665 7.75 17.5 7.75C16.5335 7.75 15.75 8.5335 15.75 9.5V17C15.75 19.6234 13.6234 21.75 11 21.75H10C8.15355 21.75 6.61978 20.4153 6.30859 18.6582C5.12499 18.3512 4.25 17.2796 4.25 16V15.75H4C3.58579 15.75 3.25 15.4142 3.25 15V6C3.25 3.92893 4.92893 2.25 7 2.25ZM5.75 16C5.75 16.6904 6.30964 17.25 7 17.25C7.69036 17.25 8.25 16.6904 8.25 16V15.75H5.75V16ZM7 3.75C5.75736 3.75 4.75 4.75736 4.75 6V14.25H9.25V6C9.25 4.75736 8.24264 3.75 7 3.75Z" fill={primary}/>
<path d="M7 2.25C7.41421 2.25 7.75 2.58579 7.75 3V7C7.75 7.41421 7.41421 7.75 7 7.75C6.58579 7.75 6.25 7.41421 6.25 7V3C6.25 2.58579 6.58579 2.25 7 2.25Z" fill={secondary}/>
    </svg>
  );
}
