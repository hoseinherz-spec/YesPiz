import type { IconProps } from '../types';

export function Bank2({
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
      <path d="M22 19.2499C22.4142 19.2499 22.75 19.5857 22.75 19.9999C22.7499 20.414 22.4142 20.7499 22 20.7499H2C1.58583 20.7499 1.25007 20.414 1.25 19.9999C1.25 19.5857 1.58579 19.2499 2 19.2499H22Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M11.4424 1.44129C11.7941 1.26577 12.208 1.26556 12.5596 1.44129L22.3359 6.32898C22.6464 6.48466 22.8101 6.83365 22.7305 7.17176C22.6506 7.50996 22.3484 7.74948 22.001 7.74988H2.00098C1.65325 7.74988 1.35152 7.51011 1.27148 7.17176C1.19175 6.83333 1.355 6.48449 1.66602 6.32898L11.4424 1.44129ZM5.17773 6.24988H18.8252L12.001 2.83777L5.17773 6.24988Z" fill={primary}/>
<path d="M6 9.25C6.41421 9.25 6.75 9.58579 6.75 10V17C6.75 17.4142 6.41421 17.75 6 17.75C5.58579 17.75 5.25 17.4142 5.25 17V10C5.25 9.58579 5.58579 9.25 6 9.25Z" fill={secondary}/>
<path d="M12 9.25C12.4142 9.25 12.75 9.58579 12.75 10V17C12.75 17.4142 12.4142 17.75 12 17.75C11.5858 17.75 11.25 17.4142 11.25 17V10C11.25 9.58579 11.5858 9.25 12 9.25Z" fill={secondary}/>
<path d="M18 9.25C18.4142 9.25 18.75 9.58579 18.75 10V17C18.75 17.4142 18.4142 17.75 18 17.75C17.5858 17.75 17.25 17.4142 17.25 17V10C17.25 9.58579 17.5858 9.25 18 9.25Z" fill={secondary}/>
    </svg>
  );
}
