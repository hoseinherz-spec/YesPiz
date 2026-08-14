import type { IconProps } from '../types';

export function MedicalCard2({
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
      <path d="M12 10.75C12.4142 10.75 12.75 11.0858 12.75 11.5V13.75H15C15.4142 13.75 15.75 14.0858 15.75 14.5C15.75 14.9142 15.4142 15.25 15 15.25H12.75V17.5C12.75 17.9142 12.4142 18.25 12 18.25C11.5858 18.25 11.25 17.9142 11.25 17.5V15.25H9C8.58579 15.25 8.25 14.9142 8.25 14.5C8.25 14.0858 8.58579 13.75 9 13.75H11.25V11.5C11.25 11.0858 11.5858 10.75 12 10.75Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M15 2.25C17.6234 2.25 19.75 4.37665 19.75 7V17C19.75 19.6234 17.6234 21.75 15 21.75H9C6.37665 21.75 4.25 19.6234 4.25 17V7C4.25 4.37665 6.37665 2.25 9 2.25H15ZM9 3.75C7.20507 3.75 5.75 5.20507 5.75 7V17C5.75 18.7949 7.20507 20.25 9 20.25H15C16.7949 20.25 18.25 18.7949 18.25 17V7C18.25 5.20507 16.7949 3.75 15 3.75H9Z" fill={primary}/>
<path d="M15 6.25C15.4142 6.25 15.75 6.58579 15.75 7C15.75 7.41421 15.4142 7.75 15 7.75H9C8.58579 7.75 8.25 7.41421 8.25 7C8.25 6.58579 8.58579 6.25 9 6.25H15Z" fill={secondary}/>
    </svg>
  );
}
