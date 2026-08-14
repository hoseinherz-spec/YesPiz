import type { IconProps } from '../types';

export function CurrencyJpy({
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
      <path d="M19.4393 2.5018C19.7144 2.19225 20.1883 2.16422 20.4979 2.4393C20.8073 2.71447 20.8354 3.18835 20.5604 3.49789L12.7498 12.284V21.9998C12.7498 22.4139 12.4139 22.7498 11.9998 22.7498C11.5857 22.7498 11.2499 22.414 11.2498 21.9998V12.284L3.4393 3.49789C3.16422 3.1883 3.19225 2.71445 3.5018 2.4393C3.81139 2.16423 4.28524 2.19225 4.56039 2.5018L11.9998 10.8709L19.4393 2.5018Z" fill={primary}/>
<path d="M19 15.25C19.4142 15.25 19.75 15.5858 19.75 16C19.75 16.4142 19.4142 16.75 19 16.75H5C4.58579 16.75 4.25 16.4142 4.25 16C4.25 15.5858 4.58579 15.25 5 15.25H19Z" fill={secondary}/>
<path d="M19 11.25C19.4142 11.25 19.75 11.5858 19.75 12C19.75 12.4142 19.4142 12.75 19 12.75H5C4.58579 12.75 4.25 12.4142 4.25 12C4.25 11.5858 4.58579 11.25 5 11.25H19Z" fill={secondary}/>
    </svg>
  );
}
