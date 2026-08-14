import type { IconProps } from '../types';

export function WaveSaw({
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
      <path d="M11.4981 2.44251C11.7181 2.24455 12.0344 2.1945 12.3048 2.31458C12.5753 2.43505 12.75 2.70402 12.7501 3.00012V19.3156L21.4981 11.4425C21.8059 11.1655 22.2806 11.1905 22.5577 11.4982C22.8348 11.806 22.8099 12.2806 22.502 12.5577L12.502 21.5577C12.282 21.7558 11.9658 21.8059 11.6954 21.6857C11.4249 21.5651 11.2501 21.2962 11.2501 21.0001V4.68372L2.50203 12.5577C2.19416 12.8348 1.71956 12.8099 1.44246 12.5021C1.16556 12.1942 1.19035 11.7196 1.49812 11.4425L11.4981 2.44251Z" fill={primary}/>
    </svg>
  );
}
