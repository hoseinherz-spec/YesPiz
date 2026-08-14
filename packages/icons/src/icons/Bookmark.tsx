import type { IconProps } from '../types';

export function Bookmark({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M14 3.25C16.6234 3.25 18.75 5.37665 18.75 8V19.1318C18.7497 20.5293 17.1922 21.363 16.0293 20.5879L12.1387 17.9941C12.0547 17.9382 11.9453 17.9382 11.8613 17.9941L7.9707 20.5879C6.80785 21.363 5.25026 20.5293 5.25 19.1318V8C5.25 5.37665 7.37665 3.25 10 3.25H14ZM10 4.75C8.20507 4.75 6.75 6.20507 6.75 8V19.1318C6.75026 19.3312 6.97265 19.4504 7.13867 19.3398L11.0293 16.7461C11.6171 16.3542 12.3829 16.3542 12.9707 16.7461L16.8613 19.3398C17.0274 19.4504 17.2497 19.3312 17.25 19.1318V8C17.25 6.20507 15.7949 4.75 14 4.75H10Z" fill={primary}/>
    </svg>
  );
}
