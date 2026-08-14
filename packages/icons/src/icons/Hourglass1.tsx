import type { IconProps } from '../types';

export function Hourglass1({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M16.3594 2.25C18.2319 2.25016 19.7498 3.76811 19.75 5.64062C19.75 6.73573 19.2212 7.76387 18.3301 8.40039L13.29 12L18.3301 15.5996C19.2212 16.2361 19.75 17.2643 19.75 18.3594C19.7498 20.2319 18.2319 21.7498 16.3594 21.75H7.64062C5.76811 21.7498 4.25016 20.2319 4.25 18.3594C4.25 17.2643 4.7788 16.2361 5.66992 15.5996L10.709 12L5.66992 8.40039C4.7788 7.76387 4.25 6.73573 4.25 5.64062C4.25016 3.76811 5.76811 2.25016 7.64062 2.25H16.3594ZM6.54199 16.8203C6.04506 17.1753 5.75 17.7487 5.75 18.3594C5.75016 19.4035 6.59654 20.2498 7.64062 20.25H16.3594C17.4035 20.2498 18.2498 19.4035 18.25 18.3594C18.25 17.7487 17.9549 17.1753 17.458 16.8203L12 12.9209L6.54199 16.8203ZM7.64062 3.75C6.59654 3.75016 5.75016 4.59654 5.75 5.64062C5.75 6.2513 6.04506 6.82474 6.54199 7.17969L12 11.0781L17.458 7.17969C17.9549 6.82474 18.25 6.2513 18.25 5.64062C18.2498 4.59654 17.4035 3.75016 16.3594 3.75H7.64062Z" fill={primary}/>
    </svg>
  );
}
