import type { IconProps } from '../types';

export function QuestionMark({
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
      <path d="M13 3.25C15.6234 3.25 17.75 5.37665 17.75 8V8.30762C17.7499 10.2404 16.5729 11.9785 14.7783 12.6963L14.1357 12.9531C13.2989 13.2878 12.75 14.0987 12.75 15C12.75 15.4142 12.4142 15.75 12 15.75C11.5858 15.75 11.25 15.4142 11.25 15C11.25 13.4854 12.1719 12.1231 13.5781 11.5605L14.2217 11.3037C15.4467 10.8136 16.2499 9.62703 16.25 8.30762V8C16.25 6.20507 14.7949 4.75 13 4.75H11C9.20507 4.75 7.75 6.20507 7.75 8C7.75 8.41421 7.41421 8.75 7 8.75C6.58579 8.75 6.25 8.41421 6.25 8C6.25 5.37665 8.37665 3.25 11 3.25H13Z" fill={primary}/>
<rect x="10.5" y="17.5" width="3" height="3" rx="1.5" fill={secondary}/>
    </svg>
  );
}
