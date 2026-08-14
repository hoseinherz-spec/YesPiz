import type { IconProps } from '../types';

export function Tie({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M14.3811 1.25C15.6819 1.25 16.528 2.61872 15.9465 3.78223L15.2229 5.22949C14.757 6.16108 13.8045 6.75 12.7629 6.75H11.2356C10.1941 6.74988 9.24139 6.16105 8.77561 5.22949L8.05198 3.78223C7.4707 2.61884 8.31684 1.25022 9.61741 1.25H14.3811ZM9.61741 2.75C9.43192 2.75022 9.31117 2.9453 9.39378 3.11133L10.1174 4.55859C10.3291 4.98198 10.7622 5.24988 11.2356 5.25H12.7629C13.2363 5.25 13.6693 4.982 13.8811 4.55859L14.6047 3.11133C14.6875 2.94518 14.5668 2.75 14.3811 2.75H9.61741Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M14.0006 5.25C14.3705 5.25019 14.6854 5.52011 14.7418 5.88574L16.3775 16.5166C16.6438 18.2485 15.9344 19.9865 14.5328 21.0381L13.0504 22.1504C12.4284 22.6167 11.5729 22.6166 10.9508 22.1504L9.46836 21.0381C8.06655 19.9865 7.3573 18.2486 7.62363 16.5166L9.25937 5.88574C9.31578 5.52001 9.6305 5.25 10.0006 5.25H14.0006ZM10.6441 6.75L9.10605 16.7441C8.9237 17.9294 9.40937 19.1193 10.3687 19.8389L11.8502 20.9502C11.9391 21.0167 12.0622 21.0168 12.151 20.9502L13.6324 19.8389C14.5916 19.1193 15.0774 17.9293 14.8951 16.7441L13.357 6.75H10.6441Z" fill={primary}/>
    </svg>
  );
}
