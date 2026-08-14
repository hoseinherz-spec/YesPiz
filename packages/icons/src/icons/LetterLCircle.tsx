import type { IconProps } from '../types';

export function LetterLCircle({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill={primary}/>
<path d="M11 6.25C11.4142 6.25 11.75 6.58579 11.75 7V13.2998C11.75 13.8722 11.7502 14.2569 11.7744 14.5527C11.7979 14.8397 11.8406 14.9768 11.8867 15.0674C12.0065 15.3025 12.1975 15.4935 12.4326 15.6133C12.5232 15.6594 12.6603 15.7021 12.9473 15.7256C13.2431 15.7498 13.6278 15.75 14.2002 15.75H15.5C15.9142 15.75 16.25 16.0858 16.25 16.5C16.25 16.9142 15.9142 17.25 15.5 17.25H14.2002C13.6525 17.25 13.1963 17.251 12.8252 17.2207C12.4455 17.1897 12.0891 17.1219 11.752 16.9502C11.2345 16.6865 10.8135 16.2655 10.5498 15.748C10.3781 15.4109 10.3103 15.0545 10.2793 14.6748C10.249 14.3037 10.25 13.8475 10.25 13.2998V7C10.25 6.58579 10.5858 6.25 11 6.25Z" fill={secondary}/>
    </svg>
  );
}
