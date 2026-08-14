import type { IconProps } from '../types';

export function Mouse2({
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
      <path d="M12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V9.25H18C18.4142 9.25 18.75 9.58579 18.75 10C18.75 10.4142 18.4142 10.75 18 10.75H6C5.58579 10.75 5.25 10.4142 5.25 10C5.25 9.58579 5.58579 9.25 6 9.25H11.25V3C11.25 2.58579 11.5858 2.25 12 2.25Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M14 2.25C16.6234 2.25 18.75 4.37665 18.75 7V17C18.75 19.6234 16.6234 21.75 14 21.75H10C7.37665 21.75 5.25 19.6234 5.25 17V7C5.25 4.37665 7.37665 2.25 10 2.25H14ZM10 3.75C8.20507 3.75 6.75 5.20507 6.75 7V17C6.75 18.7949 8.20507 20.25 10 20.25H14C15.7949 20.25 17.25 18.7949 17.25 17V7C17.25 5.20507 15.7949 3.75 14 3.75H10Z" fill={primary}/>
    </svg>
  );
}
