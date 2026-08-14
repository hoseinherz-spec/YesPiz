import type { IconProps } from '../types';

export function LetterV({
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
      <path d="M17.2818 2.78474C17.4009 2.3881 17.8197 2.1628 18.2164 2.28181C18.6127 2.4011 18.8383 2.81986 18.7193 3.21638L13.6763 20.023C13.1774 21.6854 10.8239 21.6853 10.3248 20.023L5.28181 3.21638C5.1628 2.81969 5.3881 2.4009 5.78474 2.28181C6.18134 2.16298 6.60024 2.38819 6.71931 2.78474L11.7613 19.5924C11.7837 19.6666 11.8182 19.7049 11.8502 19.7271C11.8874 19.7528 11.9405 19.7701 12.0006 19.7701C12.0607 19.77 12.1138 19.753 12.1509 19.7271C12.1829 19.7049 12.2174 19.6667 12.2398 19.5924L17.2818 2.78474Z" fill={primary}/>
    </svg>
  );
}
