import type { IconProps } from '../types';

export function Cloud1({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 4.25C15.7279 4.25 18.75 7.27208 18.75 11V11.2578C20.9808 11.3872 22.75 13.2367 22.75 15.5C22.75 17.8472 20.8472 19.75 18.5 19.75H6.5C3.6005 19.75 1.25 17.3995 1.25 14.5C1.25 11.9589 3.05492 9.84 5.45312 9.35449C6.18811 6.42189 8.83935 4.25 12 4.25ZM12 5.75C9.39356 5.75 7.22894 7.65004 6.81934 10.1406C6.76398 10.4774 6.48825 10.7351 6.14844 10.7666C4.24261 10.9434 2.75 12.5476 2.75 14.5C2.75 16.5711 4.42893 18.25 6.5 18.25H18.5C20.0188 18.25 21.25 17.0188 21.25 15.5C21.25 13.9812 20.0188 12.75 18.5 12.75H18C17.5858 12.75 17.25 12.4142 17.25 12V11C17.25 8.10051 14.8995 5.75 12 5.75Z" fill={primary}/>
    </svg>
  );
}
