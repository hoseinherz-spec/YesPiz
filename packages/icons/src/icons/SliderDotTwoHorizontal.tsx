import type { IconProps } from '../types';

export function SliderDotTwoHorizontal({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M16 10.75C17.5188 10.75 18.75 9.51878 18.75 8C18.75 6.48122 17.5188 5.25 16 5.25C14.4812 5.25 13.25 6.48122 13.25 8C13.25 9.51878 14.4812 10.75 16 10.75ZM16 9.25C15.3096 9.25 14.75 8.69036 14.75 8C14.75 7.30964 15.3096 6.75 16 6.75C16.6904 6.75 17.25 7.30964 17.25 8C17.25 8.69036 16.6904 9.25 16 9.25Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M10 18.75C11.5188 18.75 12.75 17.5188 12.75 16C12.75 14.4812 11.5188 13.25 10 13.25C8.48122 13.25 7.25 14.4812 7.25 16C7.25 17.5188 8.48122 18.75 10 18.75ZM10 17.25C9.30964 17.25 8.75 16.6904 8.75 16C8.75 15.3096 9.30964 14.75 10 14.75C10.6904 14.75 11.25 15.3096 11.25 16C11.25 16.6904 10.6904 17.25 10 17.25Z" fill={secondary}/>
<path d="M14 8.75C14.4142 8.75 14.75 8.41421 14.75 8C14.75 7.58579 14.4142 7.25 14 7.25H3C2.58579 7.25 2.25 7.58579 2.25 8C2.25 8.41421 2.58579 8.75 3 8.75H14Z" fill={primary}/>
<path d="M21 8.75C21.4142 8.75 21.75 8.41421 21.75 8C21.75 7.58579 21.4142 7.25 21 7.25H18C17.5858 7.25 17.25 7.58579 17.25 8C17.25 8.41421 17.5858 8.75 18 8.75H21Z" fill={primary}/>
<path d="M8 16.75C8.41421 16.75 8.75 16.4142 8.75 16C8.75 15.5858 8.41421 15.25 8 15.25H3C2.58579 15.25 2.25 15.5858 2.25 16C2.25 16.4142 2.58579 16.75 3 16.75H8Z" fill={primary}/>
<path d="M21 16.75C21.4142 16.75 21.75 16.4142 21.75 16C21.75 15.5858 21.4142 15.25 21 15.25H12C11.5858 15.25 11.25 15.5858 11.25 16C11.25 16.4142 11.5858 16.75 12 16.75H21Z" fill={primary}/>
    </svg>
  );
}
