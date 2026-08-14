import type { IconProps } from '../types';

export function BookClosed({
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
      <path d="M8.75 17H7.25V3H8.75V17Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M14 2.25C15.5188 2.25 16.75 3.48122 16.75 5V15C16.75 16.5188 15.5188 17.75 14 17.75H6C5.30964 17.75 4.75 18.3096 4.75 19C4.75 19.6904 5.30964 20.25 6 20.25H16C17.7949 20.25 19.25 18.7949 19.25 17V4C19.25 3.58579 19.5858 3.25 20 3.25C20.4142 3.25 20.75 3.58579 20.75 4V17C20.75 19.6234 18.6234 21.75 16 21.75H6C4.50376 21.75 3.28873 20.555 3.25293 19.0674C3.25095 19.0452 3.25 19.0227 3.25 19V7C3.25 4.37665 5.37665 2.25 8 2.25H14ZM8 3.75C6.20507 3.75 4.75 5.20507 4.75 7V16.5527C5.12532 16.3606 5.54942 16.25 6 16.25H14C14.6904 16.25 15.25 15.6904 15.25 15V5C15.25 4.30964 14.6904 3.75 14 3.75H8Z" fill={primary}/>
    </svg>
  );
}
