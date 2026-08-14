import type { IconProps } from '../types';

export function LetterD({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M9 2.25C13.8325 2.25 17.75 6.16751 17.75 11V13C17.75 17.8325 13.8325 21.75 9 21.75C7.48122 21.75 6.25 20.5188 6.25 19V5C6.25 3.48122 7.48122 2.25 9 2.25ZM9 3.75C8.30964 3.75 7.75 4.30964 7.75 5V19C7.75 19.6904 8.30964 20.25 9 20.25C13.0041 20.25 16.25 17.0041 16.25 13V11C16.25 6.99594 13.0041 3.75 9 3.75Z" fill={primary}/>
    </svg>
  );
}
