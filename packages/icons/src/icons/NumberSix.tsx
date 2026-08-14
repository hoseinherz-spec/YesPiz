import type { IconProps } from '../types';

export function NumberSix({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M14 3.25C14.4142 3.25 14.75 3.58579 14.75 4C14.75 4.41421 14.4142 4.75 14 4.75C13.0579 4.75 12.3887 4.75022 11.8623 4.78613C11.3427 4.82159 11.0168 4.889 10.7559 4.99707C9.95971 5.32692 9.32692 5.95971 8.99707 6.75586C8.889 7.01676 8.82159 7.34273 8.78613 7.8623C8.75022 8.38868 8.75 9.05786 8.75 10V11.25H12C14.6234 11.25 16.75 13.3766 16.75 16C16.75 18.6234 14.6234 20.75 12 20.75C9.37665 20.75 7.25 18.6234 7.25 16V10C7.25 9.07859 7.24986 8.34995 7.29004 7.76074C7.33069 7.16489 7.41504 6.65666 7.61133 6.18262C8.09342 5.01873 9.01873 4.09342 10.1826 3.61133C10.6567 3.41504 11.1649 3.33069 11.7607 3.29004C12.3499 3.24986 13.0786 3.25 14 3.25ZM8.75 16C8.75 17.7949 10.2051 19.25 12 19.25C13.7949 19.25 15.25 17.7949 15.25 16C15.25 14.2051 13.7949 12.75 12 12.75H8.75V16Z" fill={primary}/>
    </svg>
  );
}
