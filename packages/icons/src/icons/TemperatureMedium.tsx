import type { IconProps } from '../types';

export function TemperatureMedium({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C14.0711 1.25 15.75 2.92893 15.75 5V12.6426C16.973 13.696 17.75 15.257 17.75 17C17.75 20.1756 15.1756 22.75 12 22.75C8.82436 22.75 6.25 20.1756 6.25 17C6.25 15.257 7.02699 13.696 8.25 12.6426V5C8.25 2.92893 9.92893 1.25 12 1.25ZM12 2.75C10.7574 2.75 9.75 3.75736 9.75 5V13C9.75 13.2359 9.63878 13.4579 9.4502 13.5996C8.41631 14.3763 7.75 15.6103 7.75 17C7.75 19.3472 9.65279 21.25 12 21.25C14.3472 21.25 16.25 19.3472 16.25 17C16.25 15.6103 15.5837 14.3763 14.5498 13.5996C14.3612 13.4579 14.25 13.2359 14.25 13V5C14.25 3.75736 13.2426 2.75 12 2.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V14.3564C13.9039 14.6832 14.75 15.7415 14.75 17C14.75 18.5188 13.5188 19.75 12 19.75C10.4812 19.75 9.25 18.5188 9.25 17C9.25 15.7415 10.0961 14.6832 11.25 14.3564V11C11.25 10.5858 11.5858 10.25 12 10.25ZM12 15.75C11.3096 15.75 10.75 16.3096 10.75 17C10.75 17.6904 11.3096 18.25 12 18.25C12.6904 18.25 13.25 17.6904 13.25 17C13.25 16.3096 12.6904 15.75 12 15.75Z" fill={secondary}/>
    </svg>
  );
}
