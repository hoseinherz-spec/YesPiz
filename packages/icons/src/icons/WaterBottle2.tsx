import type { IconProps } from '../types';

export function WaterBottle2({
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
      <path d="M13 2.25C13.4142 2.25 13.75 2.58579 13.75 3C13.75 3.41421 13.4142 3.75 13 3.75H11C10.5858 3.75 10.25 3.41421 10.25 3C10.25 2.58579 10.5858 2.25 11 2.25H13Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M16 5.25C17.5188 5.25 18.75 6.48122 18.75 8C18.75 9.2584 17.9037 10.3158 16.75 10.6426V16.3564C17.9039 16.6832 18.75 17.7415 18.75 19C18.75 20.5188 17.5188 21.75 16 21.75H8C6.48122 21.75 5.25 20.5188 5.25 19C5.25 17.7415 6.09614 16.6832 7.25 16.3564V10.6426C6.09627 10.3158 5.25 9.2584 5.25 8C5.25 6.48122 6.48122 5.25 8 5.25H16ZM8 17.75C7.30964 17.75 6.75 18.3096 6.75 19C6.75 19.6904 7.30964 20.25 8 20.25H16C16.6904 20.25 17.25 19.6904 17.25 19C17.25 18.3096 16.6904 17.75 16 17.75H8ZM8.75 16.25H15.25V10.75H8.75V16.25ZM8 6.75C7.30964 6.75 6.75 7.30964 6.75 8C6.75 8.69036 7.30964 9.25 8 9.25H16C16.6904 9.25 17.25 8.69036 17.25 8C17.25 7.30964 16.6904 6.75 16 6.75H8Z" fill={primary}/>
    </svg>
  );
}
