import type { IconProps } from '../types';

export function Lifebuoy({
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
      <path d="M9.53027 15.5303L6.53027 18.5303L5.46973 17.4697L8.46973 14.4697L9.53027 15.5303Z" fill={secondary}/>
<path d="M18.5303 17.4697L17.4697 18.5303L14.4697 15.5303L15.5303 14.4697L18.5303 17.4697Z" fill={secondary}/>
<path d="M9.53027 8.46973L8.46973 9.53027L5.46973 6.53027L6.53027 5.46973L9.53027 8.46973Z" fill={secondary}/>
<path d="M18.5303 6.53027L15.5303 9.53027L14.4697 8.46973L17.4697 5.46973L18.5303 6.53027Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 7.25C14.6234 7.25 16.75 9.37665 16.75 12C16.75 14.6234 14.6234 16.75 12 16.75C9.37665 16.75 7.25 14.6234 7.25 12C7.25 9.37665 9.37665 7.25 12 7.25ZM12 8.75C10.2051 8.75 8.75 10.2051 8.75 12C8.75 13.7949 10.2051 15.25 12 15.25C13.7949 15.25 15.25 13.7949 15.25 12C15.25 10.2051 13.7949 8.75 12 8.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill={primary}/>
    </svg>
  );
}
