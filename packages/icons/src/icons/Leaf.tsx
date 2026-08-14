import type { IconProps } from '../types';

export function Leaf({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M20 3.25001C20.4142 3.25001 20.75 3.5858 20.75 4.00001C20.75 7.66419 20.759 9.6745 20.2236 11.3223C19.1602 14.5947 16.5947 17.1602 13.3223 18.2236C11.6745 18.759 9.66419 18.75 6.00001 18.75C5.5858 18.75 5.25001 18.4142 5.25001 18C5.25001 14.3358 5.24098 12.3255 5.77638 10.6777C6.83978 7.40534 9.40534 4.83978 12.6777 3.77638C14.3255 3.24098 16.3358 3.25001 20 3.25001ZM19.2471 4.75196C15.9846 4.75503 14.4124 4.79023 13.1416 5.20313C10.3257 6.11814 8.11814 8.32565 7.20313 11.1416C6.79023 12.4124 6.75503 13.9846 6.75196 17.2471C10.0151 17.244 11.5875 17.2098 12.8584 16.7969C15.6744 15.8819 17.8819 13.6744 18.7969 10.8584C19.2098 9.58749 19.244 8.01507 19.2471 4.75196Z" fill={primary}/>
<path d="M14.4697 8.46967C14.7626 8.17678 15.2373 8.17678 15.5302 8.46967C15.8231 8.76257 15.8231 9.23734 15.5302 9.53022L3.53022 21.5302C3.23734 21.8231 2.76257 21.8231 2.46967 21.5302C2.17678 21.2373 2.17678 20.7626 2.46967 20.4697L14.4697 8.46967Z" fill={secondary}/>
    </svg>
  );
}
