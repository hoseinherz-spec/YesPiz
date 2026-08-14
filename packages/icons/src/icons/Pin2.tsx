import type { IconProps } from '../types';

export function Pin2({
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
      <path d="M9.53027 15.5303L4.06055 21H3V19.9395L8.46973 14.4697L9.53027 15.5303Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M12.4697 4.46895C14.4194 2.51947 17.5806 2.51946 19.5303 4.46895C21.48 6.41863 21.4798 9.57973 19.5303 11.5295L17.5596 13.5002C17.0413 14.0186 16.7501 14.7222 16.75 15.4553V15.5988C16.75 17.3343 16.0601 18.9995 14.833 20.2268L14.5303 20.5295C14.2374 20.8224 13.7626 20.8224 13.4697 20.5295L3.46973 10.5295C3.3292 10.3889 3.25 10.198 3.25 9.99922C3.2501 9.80045 3.32917 9.60951 3.46973 9.46895L3.77246 9.16621C4.9997 7.93908 6.66488 7.24922 8.40039 7.24922H8.54395C9.27713 7.24922 9.98055 6.95805 10.499 6.43965L12.4697 4.46895ZM18.4697 5.52949C17.1058 4.1658 14.8942 4.1658 13.5303 5.52949L11.5596 7.5002C10.7598 8.2999 9.67495 8.74922 8.54395 8.74922H8.40039C7.17028 8.74922 5.98638 9.19926 5.06836 10.007L13.9912 18.9299C14.7989 18.0119 15.25 16.8289 15.25 15.5988V15.4553C15.2501 14.3244 15.6994 13.2393 16.499 12.4397L18.4697 10.4689C19.8335 9.10497 19.8336 6.89339 18.4697 5.52949Z" fill={primary}/>
    </svg>
  );
}
