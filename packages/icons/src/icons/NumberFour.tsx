import type { IconProps } from '../types';

export function NumberFour({
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
      <path d="M8 2.25C8.41422 2.25 8.75 2.58579 8.75 3V7.2002C8.75 8.05254 8.75029 8.64678 8.78809 9.10938C8.82517 9.5632 8.89449 9.82398 8.99512 10.0215C9.21083 10.4448 9.55515 10.7892 9.97852 11.0049C10.176 11.1055 10.4368 11.1748 10.8906 11.2119C11.3532 11.2497 11.9475 11.25 12.7998 11.25H16C16.4142 11.25 16.75 11.5858 16.75 12C16.75 12.4142 16.4142 12.75 16 12.75H12.7998C11.9722 12.75 11.3064 12.751 10.7686 12.707C10.2219 12.6624 9.74205 12.5671 9.29785 12.3408C8.59225 11.9813 8.01871 11.4078 7.65918 10.7021C7.43287 10.2579 7.33763 9.77805 7.29297 9.23145C7.24903 8.69362 7.25 8.02778 7.25 7.2002V3C7.25 2.58579 7.58579 2.25 8 2.25Z" fill={secondary}/>
<path d="M16 2.25C16.4142 2.25 16.75 2.58579 16.75 3V21C16.75 21.4142 16.4142 21.75 16 21.75C15.5858 21.75 15.25 21.4142 15.25 21V3C15.25 2.58579 15.5858 2.25 16 2.25Z" fill={primary}/>
    </svg>
  );
}
