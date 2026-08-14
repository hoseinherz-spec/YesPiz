import type { IconProps } from '../types';

export function Note1({
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
      <path d="M21 15.75H17C16.3096 15.75 15.75 16.3096 15.75 17V21H14.25V17C14.25 15.4812 15.4812 14.25 17 14.25H21V15.75Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M17 2.25C19.6234 2.25 21.75 4.37665 21.75 7V13.3428C21.75 14.6026 21.2492 15.8113 20.3584 16.7021L16.7021 20.3584C15.8114 21.2492 14.6026 21.75 13.3428 21.75H7C4.37665 21.75 2.25 19.6234 2.25 17V7C2.25 4.37665 4.37665 2.25 7 2.25H17ZM7 3.75C5.20507 3.75 3.75 5.20507 3.75 7V17C3.75 18.7949 5.20507 20.25 7 20.25H13.3428C14.2047 20.25 15.0321 19.9073 15.6416 19.2979L19.2979 15.6416C19.9073 15.0321 20.25 14.2047 20.25 13.3428V7C20.25 5.20507 18.7949 3.75 17 3.75H7Z" fill={primary}/>
    </svg>
  );
}
