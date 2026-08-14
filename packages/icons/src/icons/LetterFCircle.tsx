import type { IconProps } from '../types';

export function LetterFCircle({
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
<path d="M15.5 6.75C15.9142 6.75 16.25 7.08579 16.25 7.5C16.25 7.91421 15.9142 8.25 15.5 8.25H12C11.3096 8.25 10.75 8.80964 10.75 9.5V11.25H14.5C14.9142 11.25 15.25 11.5858 15.25 12C15.25 12.4142 14.9142 12.75 14.5 12.75H10.75V17C10.75 17.4142 10.4142 17.75 10 17.75C9.58579 17.75 9.25 17.4142 9.25 17V9.5C9.25 7.98122 10.4812 6.75 12 6.75H15.5Z" fill={secondary}/>
    </svg>
  );
}
