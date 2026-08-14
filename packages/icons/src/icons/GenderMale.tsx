import type { IconProps } from '../types';

export function GenderMale({
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
      <path d="M21.0303 4.03027L15.5303 9.53027L14.4697 8.46973L19.9697 2.96973L21.0303 4.03027Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M10 6.25C14.2802 6.25 17.75 9.7198 17.75 14C17.75 18.2802 14.2802 21.75 10 21.75C5.71979 21.75 2.25 18.2802 2.25 14C2.25 9.7198 5.71979 6.25 10 6.25ZM10 7.75C6.54822 7.75 3.75 10.5482 3.75 14C3.75 17.4518 6.54822 20.25 10 20.25C13.4518 20.25 16.25 17.4518 16.25 14C16.25 10.5482 13.4518 7.75 10 7.75Z" fill={primary}/>
<path d="M17.7998 2.25C18.3475 2.25 18.8037 2.24898 19.1748 2.2793C19.5545 2.31033 19.9109 2.3781 20.248 2.54981C20.7655 2.81346 21.1865 3.23451 21.4502 3.75196C21.6219 4.0891 21.6897 4.44547 21.7207 4.8252C21.751 5.19633 21.75 5.65252 21.75 6.2002V9C21.75 9.41422 21.4142 9.75 21 9.75C20.5858 9.75 20.25 9.41422 20.25 9V6.2002C20.25 5.62777 20.2498 5.24315 20.2256 4.94727C20.2021 4.66027 20.1594 4.52316 20.1133 4.43262C19.9935 4.19751 19.8025 4.00655 19.5674 3.88672C19.4768 3.84059 19.3397 3.79788 19.0527 3.77442C18.7569 3.75024 18.3722 3.75 17.7998 3.75H15C14.5858 3.75 14.25 3.41422 14.25 3C14.25 2.58579 14.5858 2.25 15 2.25H17.7998Z" fill={primary}/>
    </svg>
  );
}
