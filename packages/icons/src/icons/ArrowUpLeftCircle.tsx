import type { IconProps } from '../types';

export function ArrowUpLeftCircle({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 6.61522 17.3848 2.25 12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75ZM12 20.25C7.44365 20.25 3.75 16.5563 3.75 12C3.75 7.44365 7.44365 3.75 12 3.75C16.5563 3.75 20.25 7.44365 20.25 12C20.25 16.5563 16.5563 20.25 12 20.25Z" fill={primary}/>
<path d="M14.4697 15.5303C14.7626 15.8232 15.2374 15.8232 15.5303 15.5303C15.8231 15.2374 15.8232 14.7626 15.5303 14.4697L10.3457 9.28614C10.3774 9.28259 10.411 9.27738 10.4473 9.27442C10.7431 9.25024 11.1278 9.25 11.7002 9.25H14C14.4142 9.25 14.75 8.91422 14.75 8.5C14.75 8.08582 14.4142 7.75 14 7.75H11.7002C11.1525 7.75 10.6963 7.74898 10.3252 7.7793C9.94547 7.81033 9.58909 7.8781 9.25196 8.04981C8.73453 8.31345 8.31346 8.73453 8.04981 9.25196C7.8781 9.58908 7.81033 9.94549 7.7793 10.3252C7.74898 10.6963 7.75 11.1525 7.75 11.7002V14C7.75 14.4142 8.08579 14.75 8.5 14.75C8.91422 14.75 9.25 14.4142 9.25 14V11.7002C9.25 11.1278 9.25024 10.7431 9.27442 10.4473C9.27735 10.4114 9.28166 10.378 9.28516 10.3467L14.4697 15.5303Z" fill={secondary}/>
    </svg>
  );
}
