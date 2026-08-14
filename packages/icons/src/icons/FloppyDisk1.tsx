import type { IconProps } from '../types';

export function FloppyDisk1({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M14.3428 3.25C15.6026 3.25 16.8114 3.7508 17.7021 4.6416L19.3584 6.29785C20.2492 7.18865 20.75 8.39745 20.75 9.65723V16C20.75 18.6234 18.6234 20.75 16 20.75H8C5.37665 20.75 3.25 18.6234 3.25 16V8C3.25 5.37665 5.37665 3.25 8 3.25H14.3428ZM7.25 4.83789C5.81675 5.17655 4.75 6.46328 4.75 8V16C4.75 17.7949 6.20507 19.25 8 19.25H16C17.7949 19.25 19.25 17.7949 19.25 16V9.65723C19.25 8.79527 18.9073 7.96789 18.2979 7.3584L16.75 5.81055V6C16.75 7.51878 15.5188 8.75 14 8.75H10C8.48122 8.75 7.25 7.51878 7.25 6V4.83789ZM8.75 6C8.75 6.69036 9.30964 7.25 10 7.25H14C14.6904 7.25 15.25 6.69036 15.25 6V4.87988C14.9577 4.79489 14.6525 4.75 14.3428 4.75H8.75V6Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 10.25C14.0711 10.25 15.75 11.9289 15.75 14C15.75 16.0711 14.0711 17.75 12 17.75C9.92893 17.75 8.25 16.0711 8.25 14C8.25 11.9289 9.92893 10.25 12 10.25ZM12 11.75C10.7574 11.75 9.75 12.7574 9.75 14C9.75 15.2426 10.7574 16.25 12 16.25C13.2426 16.25 14.25 15.2426 14.25 14C14.25 12.7574 13.2426 11.75 12 11.75Z" fill={secondary}/>
    </svg>
  );
}
