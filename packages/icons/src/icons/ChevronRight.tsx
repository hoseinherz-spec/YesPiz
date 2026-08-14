import type { IconProps } from '../types';

export function ChevronRight({
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
      <path d="M8.46967 3.46967C8.76256 3.17678 9.23732 3.17678 9.53022 3.46967L13.0048 6.94428C13.788 7.72749 14.4077 8.34676 14.8652 8.88569C15.3283 9.43127 15.6692 9.94393 15.8603 10.5322C16.1702 11.4862 16.1703 12.5137 15.8603 13.4677C15.6691 14.056 15.3283 14.5686 14.8652 15.1142C14.4077 15.6531 13.7881 16.2724 13.0048 17.0556L9.53022 20.5302C9.23734 20.8231 8.76257 20.8231 8.46967 20.5302C8.17678 20.2373 8.17678 19.7626 8.46967 19.4697L11.9443 15.9951C12.745 15.1943 13.313 14.6249 13.7216 14.1435C14.1246 13.6688 14.3279 13.3288 14.4335 13.0038C14.6455 12.3513 14.6455 11.6486 14.4335 10.996C14.3279 10.6711 14.1246 10.331 13.7216 9.85639C13.313 9.37502 12.745 8.80553 11.9443 8.00483L8.46967 4.53022C8.17678 4.23732 8.17678 3.76256 8.46967 3.46967Z" fill={primary}/>
    </svg>
  );
}
