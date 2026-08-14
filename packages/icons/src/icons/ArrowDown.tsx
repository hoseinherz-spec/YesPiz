import type { IconProps } from '../types';

export function ArrowDown({
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
      <path d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4V19C12.75 19.4142 12.4142 19.75 12 19.75C11.5858 19.75 11.25 19.4142 11.25 19V4C11.25 3.58579 11.5858 3.25 12 3.25Z" fill={primary}/>
<path d="M18.4697 13.4697C18.7626 13.1768 19.2373 13.1768 19.5302 13.4697C19.8231 13.7626 19.8231 14.2373 19.5302 14.5302L17.0556 17.0048C16.2724 17.7881 15.6531 18.4077 15.1142 18.8652C14.5686 19.3283 14.056 19.6691 13.4677 19.8603C12.5137 20.1703 11.4862 20.1702 10.5322 19.8603C9.94393 19.6692 9.43127 19.3283 8.88569 18.8652C8.34676 18.4077 7.72749 17.788 6.94428 17.0048L4.46967 14.5302C4.17678 14.2373 4.17678 13.7626 4.46967 13.4697C4.76256 13.1768 5.23732 13.1768 5.53022 13.4697L8.00483 15.9443C8.80553 16.745 9.37502 17.313 9.85639 17.7216C10.331 18.1246 10.6711 18.3279 10.996 18.4335C11.6486 18.6455 12.3513 18.6455 13.0038 18.4335C13.3288 18.3279 13.6688 18.1246 14.1435 17.7216C14.6249 17.313 15.1943 16.745 15.9951 15.9443L18.4697 13.4697Z" fill={secondary}/>
    </svg>
  );
}
