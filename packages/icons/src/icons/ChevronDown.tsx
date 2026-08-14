import type { IconProps } from '../types';

export function ChevronDown({
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
      <path d="M19.4697 8.46967C19.7626 8.17678 20.2373 8.17678 20.5302 8.46967C20.8231 8.76257 20.8231 9.23734 20.5302 9.53022L17.0556 13.0048C16.2724 13.7881 15.6531 14.4077 15.1142 14.8652C14.5686 15.3283 14.056 15.6691 13.4677 15.8603C12.5137 16.1703 11.4862 16.1702 10.5322 15.8603C9.94393 15.6692 9.43126 15.3283 8.88568 14.8652C8.34676 14.4077 7.72749 13.788 6.94428 13.0048L3.46967 9.53022C3.17678 9.23732 3.17678 8.76256 3.46967 8.46967C3.76256 8.17678 4.23732 8.17678 4.53022 8.46967L8.00483 11.9443C8.80553 12.745 9.37502 13.313 9.85639 13.7216C10.331 14.1246 10.6711 14.3279 10.996 14.4335C11.6486 14.6455 12.3513 14.6455 13.0038 14.4335C13.3288 14.3279 13.6688 14.1246 14.1435 13.7216C14.6249 13.313 15.1943 12.745 15.9951 11.9443L19.4697 8.46967Z" fill={primary}/>
    </svg>
  );
}
