import type { IconProps } from '../types';

export function Rna({
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
      <path d="M18 18.25C18.4142 18.25 18.75 18.5858 18.75 19C18.75 19.4142 18.4142 19.75 18 19.75H6C5.58579 19.75 5.25 19.4142 5.25 19C5.25 18.5858 5.58579 18.25 6 18.25H18Z" fill={secondary}/>
<path d="M17 15.25C17.4142 15.25 17.75 15.5858 17.75 16C17.75 16.4142 17.4142 16.75 17 16.75H9C8.58579 16.75 8.25 16.4142 8.25 16C8.25 15.5858 8.58579 15.25 9 15.25H17Z" fill={secondary}/>
<path d="M15 7.25C15.4142 7.25 15.75 7.58579 15.75 8C15.75 8.41421 15.4142 8.75 15 8.75H7C6.58579 8.75 6.25 8.41421 6.25 8C6.25 7.58579 6.58579 7.25 7 7.25H15Z" fill={secondary}/>
<path d="M18 4.25C18.4142 4.25 18.75 4.58579 18.75 5C18.75 5.41421 18.4142 5.75 18 5.75H6C5.58579 5.75 5.25 5.41421 5.25 5C5.25 4.58579 5.58579 4.25 6 4.25H18Z" fill={secondary}/>
<path d="M6 2V2.86224C6 4.74066 6 5.67988 6.2589 6.53241C6.48811 7.28715 6.86388 7.98929 7.36473 8.59865C7.93046 9.28697 8.71193 9.80796 10.2749 10.8499L13.7251 13.1501C15.2881 14.192 16.0695 14.713 16.6353 15.4013C17.1361 16.0107 17.5119 16.7129 17.7411 17.4676C18 18.3201 18 19.2593 18 21.1378V22" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
