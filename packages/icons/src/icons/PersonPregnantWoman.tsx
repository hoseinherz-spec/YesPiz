import type { IconProps } from '../types';

export function PersonPregnantWoman({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 1.25C13.5188 1.25 14.75 2.48122 14.75 4C14.75 5.51878 13.5188 6.75 12 6.75C10.4812 6.75 9.25 5.51878 9.25 4C9.25 2.48122 10.4812 1.25 12 1.25ZM12 2.75C11.3096 2.75 10.75 3.30964 10.75 4C10.75 4.69036 11.3096 5.25 12 5.25C12.6904 5.25 13.25 4.69036 13.25 4C13.25 3.30964 12.6904 2.75 12 2.75Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12 7.25C13.5188 7.25 14.75 8.48122 14.75 10V10.3564C15.9039 10.6832 16.75 11.7415 16.75 13V16C16.75 16.4142 16.4142 16.75 16 16.75H13.75V22C13.75 22.4142 13.4142 22.75 13 22.75C12.8069 22.75 12.6329 22.6746 12.5 22.5547C12.3671 22.6746 12.1931 22.75 12 22.75C11.5858 22.75 11.25 22.4142 11.25 22V16.75H10C9.58579 16.75 9.25 16.4142 9.25 16V10C9.25 8.48122 10.4812 7.25 12 7.25ZM12 8.75C11.3096 8.75 10.75 9.30964 10.75 10V15.25H15.25V13C15.25 12.3096 14.6904 11.75 14 11.75C13.5858 11.75 13.25 11.4142 13.25 11V10C13.25 9.30964 12.6904 8.75 12 8.75Z" fill={primary}/>
    </svg>
  );
}
