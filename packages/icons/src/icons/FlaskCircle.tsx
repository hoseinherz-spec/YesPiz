import type { IconProps } from '../types';

export function FlaskCircle({
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
      <path d="M9.58594 13.25C10.6903 13.25 11.7494 13.6888 12.5303 14.4697C13.0299 14.9693 13.7075 15.25 14.4141 15.25H18.5C18.9142 15.25 19.25 15.5858 19.25 16C19.25 16.4142 18.9142 16.75 18.5 16.75H14.4141C13.3097 16.75 12.2506 16.3112 11.4697 15.5303C10.9701 15.0307 10.2925 14.75 9.58594 14.75H5C4.58579 14.75 4.25 14.4142 4.25 14C4.25 13.5858 4.58579 13.25 5 13.25H9.58594Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M16 2.25C16.4142 2.25 16.75 2.58579 16.75 3C16.75 3.41421 16.4142 3.75 16 3.75H14.75V6.75391C17.6718 7.86328 19.75 10.6873 19.75 14C19.75 18.2802 16.2802 21.75 12 21.75C7.71979 21.75 4.25 18.2802 4.25 14C4.25 10.6873 6.32824 7.86328 9.25 6.75391V3.75H8C7.58579 3.75 7.25 3.41421 7.25 3C7.25 2.58579 7.58579 2.25 8 2.25H16ZM10.75 7.29102C10.75 7.62282 10.5319 7.9151 10.2139 8.00977C7.63165 8.77844 5.75 11.1702 5.75 14C5.75 17.4518 8.54822 20.25 12 20.25C15.4518 20.25 18.25 17.4518 18.25 14C18.25 11.1702 16.3684 8.77844 13.7861 8.00977C13.4681 7.9151 13.25 7.62282 13.25 7.29102V3.75H10.75V7.29102Z" fill={primary}/>
    </svg>
  );
}
