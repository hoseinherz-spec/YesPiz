import type { IconProps } from '../types';

export function ArrowDownLeft({
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
      <path d="M6.46967 17.5303C6.76256 17.8232 7.23732 17.8232 7.53022 17.5303L18.5302 6.53033C18.8231 6.23743 18.8231 5.76266 18.5302 5.46978C18.2373 5.17691 17.7626 5.17695 17.4697 5.46978L6.46967 16.4698C6.17678 16.7627 6.17678 17.2374 6.46967 17.5303Z" fill={primary}/>
<path d="M17 18.75C17.4142 18.75 17.75 18.4142 17.75 18C17.75 17.5858 17.4142 17.25 17 17.25H9.2002C8.62777 17.25 8.24315 17.2498 7.94727 17.2256C7.66027 17.2021 7.52316 17.1594 7.43262 17.1133C7.19751 16.9935 7.00655 16.8025 6.88672 16.5674C6.84059 16.4768 6.79788 16.3397 6.77442 16.0527C6.75024 15.7569 6.75 15.3722 6.75 14.7998V7C6.75 6.58578 6.41422 6.25 6 6.25C5.58579 6.25 5.25 6.58578 5.25 7V14.7998C5.25 15.3475 5.24898 15.8037 5.2793 16.1748C5.31033 16.5545 5.3781 16.9109 5.54981 17.248C5.81346 17.7655 6.23451 18.1865 6.75196 18.4502C7.0891 18.6219 7.44547 18.6897 7.8252 18.7207C8.19633 18.751 8.65252 18.75 9.2002 18.75H17Z" fill={secondary}/>
    </svg>
  );
}
