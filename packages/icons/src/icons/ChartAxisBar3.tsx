import type { IconProps } from '../types';

export function ChartAxisBar3({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M9.5 14.25C10.7426 14.25 11.75 15.2574 11.75 16.5V21C11.75 21.4142 11.4142 21.75 11 21.75H7C6.58579 21.75 6.25 21.4142 6.25 21V16.5C6.25 15.2574 7.25736 14.25 8.5 14.25H9.5ZM8.5 15.75C8.08579 15.75 7.75 16.0858 7.75 16.5V20.25H10.25V16.5C10.25 16.0858 9.91421 15.75 9.5 15.75H8.5Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M3 2.25C3.41422 2.25 3.75 2.58579 3.75 3V17.7998C3.75 18.3722 3.75024 18.7569 3.77442 19.0527C3.79788 19.3397 3.84059 19.4768 3.88672 19.5674C4.00655 19.8025 4.19751 19.9935 4.43262 20.1133C4.52316 20.1594 4.66027 20.2021 4.94727 20.2256C5.24315 20.2498 5.62777 20.25 6.2002 20.25H14.25V6.5C14.25 5.25736 15.2574 4.25 16.5 4.25H17.5C18.7426 4.25 19.75 5.25736 19.75 6.5V20.25H21C21.4142 20.25 21.75 20.5858 21.75 21C21.75 21.4142 21.4142 21.75 21 21.75H6.2002C5.65252 21.75 5.19633 21.751 4.8252 21.7207C4.44547 21.6897 4.0891 21.6219 3.75196 21.4502C3.23451 21.1865 2.81346 20.7655 2.54981 20.248C2.3781 19.9109 2.31033 19.5545 2.2793 19.1748C2.24898 18.8037 2.25 18.3475 2.25 17.7998V3C2.25 2.58579 2.58579 2.25 3 2.25ZM16.5 5.75C16.0858 5.75 15.75 6.08579 15.75 6.5V20.25H18.25V6.5C18.25 6.08579 17.9142 5.75 17.5 5.75H16.5Z" fill={primary}/>
    </svg>
  );
}
