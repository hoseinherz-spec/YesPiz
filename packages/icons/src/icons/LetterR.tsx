import type { IconProps } from '../types';

export function LetterR({
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
      <path d="M11.4111 12.25C13.2815 12.25 14.9778 13.3476 15.7441 15.0537L18.2764 20.6924C18.446 21.0702 18.2773 21.5149 17.8994 21.6846C17.5217 21.854 17.0779 21.6852 16.9082 21.3076L14.376 15.6689C13.8517 14.5014 12.691 13.75 11.4111 13.75H11C10.5858 13.75 10.25 13.4142 10.25 13C10.25 12.5858 10.5858 12.25 11 12.25H11.4111Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M13 2.25C15.6234 2.25 17.75 4.37665 17.75 7V9C17.75 11.6234 15.6234 13.75 13 13.75H8.75V21C8.75 21.4142 8.41421 21.75 8 21.75C7.58579 21.75 7.25 21.4142 7.25 21V4C7.25 3.0335 8.0335 2.25 9 2.25H13ZM9 3.75C8.86193 3.75 8.75 3.86193 8.75 4V12.25H13C14.7949 12.25 16.25 10.7949 16.25 9V7C16.25 5.20507 14.7949 3.75 13 3.75H9Z" fill={primary}/>
    </svg>
  );
}
