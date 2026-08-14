import type { IconProps } from '../types';

export function ArrowTopLeft({
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
      <path d="M6.46967 6.46967C6.76256 6.17678 7.23732 6.17678 7.53022 6.46967L18.5302 17.4697C18.8231 17.7626 18.8231 18.2373 18.5302 18.5302C18.2373 18.8231 17.7626 18.8231 17.4697 18.5302L6.46967 7.53022C6.17678 7.23732 6.17678 6.76256 6.46967 6.46967Z" fill={primary}/>
<path d="M17 5.25C17.4142 5.25 17.75 5.58579 17.75 6C17.75 6.41422 17.4142 6.75 17 6.75H9.2002C8.62777 6.75 8.24315 6.75024 7.94727 6.77442C7.66027 6.79788 7.52316 6.84059 7.43262 6.88672C7.19751 7.00655 7.00655 7.19751 6.88672 7.43262C6.84059 7.52316 6.79788 7.66027 6.77442 7.94727C6.75024 8.24315 6.75 8.62777 6.75 9.2002V17C6.75 17.4142 6.41422 17.75 6 17.75C5.58579 17.75 5.25 17.4142 5.25 17V9.2002C5.25 8.65252 5.24898 8.19633 5.2793 7.8252C5.31033 7.44547 5.3781 7.0891 5.54981 6.75196C5.81346 6.23451 6.23451 5.81346 6.75196 5.54981C7.0891 5.3781 7.44547 5.31033 7.8252 5.2793C8.19633 5.24898 8.65252 5.25 9.2002 5.25H17Z" fill={secondary}/>
    </svg>
  );
}
