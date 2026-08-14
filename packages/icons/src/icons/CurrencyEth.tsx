import type { IconProps } from '../types';

export function CurrencyEth({
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
      <path d="M19.2959 12.6895L12.2959 15.6895C12.1072 15.7703 11.8928 15.7703 11.7041 15.6895L4.7041 12.6895L5.2959 11.3105L12 14.1836L18.7041 11.3105L19.2959 12.6895Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12.0007 1.25C12.2453 1.2501 12.4746 1.3699 12.6149 1.57031L19.6149 11.5703C19.7954 11.8284 19.7954 12.1716 19.6149 12.4297L12.6149 22.4297C12.4746 22.6301 12.2453 22.7499 12.0007 22.75C11.756 22.75 11.5268 22.6301 11.3864 22.4297L4.38642 12.4297C4.20583 12.1715 4.20583 11.8285 4.38642 11.5703L11.3864 1.57031L11.4431 1.49902C11.5843 1.34184 11.7865 1.25 12.0007 1.25ZM5.91571 12L11.2507 19.6201V4.37793L5.91571 12ZM12.7507 19.6201L18.0856 12L12.7507 4.37793V19.6201Z" fill={primary}/>
    </svg>
  );
}
