import type { IconProps } from '../types';

export function Flag2({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M11.8818 3.25C12.8511 3.25 13.7374 3.79808 14.1709 4.66504C14.3504 5.02359 14.7172 5.25 15.1182 5.25H18C19.5188 5.25 20.75 6.48122 20.75 8V13C20.75 14.5188 19.5188 15.75 18 15.75H15.1182C14.1489 15.75 13.2626 15.2019 12.8291 14.335C12.6496 13.9764 12.2828 13.75 11.8818 13.75H6.75V22C6.75 22.4142 6.41421 22.75 6 22.75C5.58579 22.75 5.25 22.4142 5.25 22V6C5.25 4.48122 6.48122 3.25 8 3.25H11.8818ZM8 4.75C7.30964 4.75 6.75 5.30964 6.75 6V12.25H11.8818C12.8511 12.25 13.7374 12.7981 14.1709 13.665C14.3504 14.0236 14.7172 14.25 15.1182 14.25H18C18.6904 14.25 19.25 13.6904 19.25 13V8C19.25 7.30964 18.6904 6.75 18 6.75H15.1182C14.1489 6.75 13.2626 6.20192 12.8291 5.33496C12.6496 4.97641 12.2828 4.75 11.8818 4.75H8Z" fill={primary}/>
    </svg>
  );
}
