import type { IconProps } from '../types';

export function Newspaper1({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M22 5.25C22.4142 5.25 22.75 5.58579 22.75 6V17C22.75 18.5188 21.5188 19.75 20 19.75H5C4.97326 19.75 4.94692 19.7478 4.9209 19.7451C3.43875 19.7032 2.25 18.4923 2.25 17V8C2.25 7.58579 2.58579 7.25 3 7.25C3.41421 7.25 3.75 7.58579 3.75 8V17C3.75 17.6904 4.30964 18.25 5 18.25C5.69036 18.25 6.25 17.6904 6.25 17V6C6.25 5.58579 6.58579 5.25 7 5.25H22ZM7.75 17C7.75 17.4506 7.63935 17.8747 7.44727 18.25H20C20.6904 18.25 21.25 17.6904 21.25 17V6.75H7.75V17Z" fill={primary}/>
<path d="M16 13.25C16.4142 13.25 16.75 13.5858 16.75 14C16.75 14.4142 16.4142 14.75 16 14.75H10C9.58579 14.75 9.25 14.4142 9.25 14C9.25 13.5858 9.58579 13.25 10 13.25H16Z" fill={secondary}/>
<path d="M19 9.25C19.4142 9.25 19.75 9.58579 19.75 10C19.75 10.4142 19.4142 10.75 19 10.75H10C9.58579 10.75 9.25 10.4142 9.25 10C9.25 9.58579 9.58579 9.25 10 9.25H19Z" fill={secondary}/>
    </svg>
  );
}
