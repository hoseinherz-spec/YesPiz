import type { IconProps } from '../types';

export function ArrowRight({
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
      <path d="M19 11.25C19.4142 11.25 19.75 11.5858 19.75 12C19.75 12.4142 19.4142 12.75 19 12.75H4C3.58579 12.75 3.25 12.4142 3.25 12C3.25 11.5858 3.58579 11.25 4 11.25H19Z" fill={primary}/>
<path d="M13.4697 4.46967C13.7626 4.17678 14.2373 4.17678 14.5302 4.46967L17.0048 6.94428C17.788 7.72749 18.4077 8.34676 18.8652 8.88569C19.3283 9.43127 19.6692 9.94393 19.8603 10.5322C20.1702 11.4862 20.1703 12.5137 19.8603 13.4677C19.6691 14.056 19.3283 14.5686 18.8652 15.1142C18.4077 15.6531 17.7881 16.2724 17.0048 17.0556L14.5302 19.5302C14.2373 19.8231 13.7626 19.8231 13.4697 19.5302C13.1768 19.2373 13.1768 18.7626 13.4697 18.4697L15.9443 15.9951C16.745 15.1943 17.313 14.6249 17.7216 14.1435C18.1246 13.6688 18.3279 13.3288 18.4335 13.0038C18.6455 12.3513 18.6455 11.6486 18.4335 10.996C18.3279 10.6711 18.1246 10.331 17.7216 9.85639C17.313 9.37502 16.745 8.80553 15.9443 8.00483L13.4697 5.53022C13.1768 5.23732 13.1768 4.76256 13.4697 4.46967Z" fill={secondary}/>
    </svg>
  );
}
