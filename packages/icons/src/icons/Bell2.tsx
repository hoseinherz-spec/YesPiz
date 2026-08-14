import type { IconProps } from '../types';

export function Bell2({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M11.9992 2.25C15.7272 2.25 18.7492 5.27208 18.7492 9V10.1113C18.7492 11.2368 19.0116 12.3469 19.5149 13.3535L20.9465 16.2178C21.528 17.3813 20.6819 18.75 19.3811 18.75H4.61741C3.31684 18.7498 2.4707 17.3812 3.05198 16.2178L4.48362 13.3535C4.98694 12.3468 5.24924 11.2368 5.24924 10.1113V9C5.24924 5.27218 8.27147 2.25017 11.9992 2.25ZM11.9992 3.75C9.0999 3.75017 6.74924 6.10061 6.74924 9V10.1113C6.74924 11.4697 6.43288 12.8095 5.82542 14.0244L4.39378 16.8887C4.31117 17.0547 4.43192 17.2498 4.61741 17.25H19.3811C19.5668 17.25 19.6875 17.0548 19.6047 16.8887L18.1731 14.0244C17.5657 12.8095 17.2492 11.4696 17.2492 10.1113V9C17.2492 6.10051 14.8987 3.75 11.9992 3.75Z" fill={primary}/>
<path d="M15 20.25C15.4142 20.25 15.75 20.5858 15.75 21C15.75 21.4142 15.4142 21.75 15 21.75H9C8.58579 21.75 8.25 21.4142 8.25 21C8.25 20.5858 8.58579 20.25 9 20.25H15Z" fill={secondary}/>
    </svg>
  );
}
