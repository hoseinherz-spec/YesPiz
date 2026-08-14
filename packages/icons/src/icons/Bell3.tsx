import type { IconProps } from '../types';

export function Bell3({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M11.9993 2.25C15.8455 2.25 19.1571 4.96483 19.9114 8.73633L21.4954 16.6572C21.7117 17.7399 20.8838 18.75 19.7796 18.75H4.21905C3.11508 18.7498 2.28701 17.7398 2.50323 16.6572L4.08722 8.73633C4.84154 4.96491 8.15324 2.25015 11.9993 2.25ZM11.9993 3.75C8.86832 3.75015 6.17208 5.96009 5.55792 9.03027L3.97394 16.9512C3.94321 17.1056 4.06158 17.2498 4.21905 17.25H19.7796C19.9373 17.25 20.0555 17.1058 20.0247 16.9512L18.4407 9.03027C17.8265 5.96001 15.1305 3.75 11.9993 3.75Z" fill={primary}/>
<path d="M15 20.25C15.4142 20.25 15.75 20.5858 15.75 21C15.75 21.4142 15.4142 21.75 15 21.75H9C8.58579 21.75 8.25 21.4142 8.25 21C8.25 20.5858 8.58579 20.25 9 20.25H15Z" fill={secondary}/>
    </svg>
  );
}
