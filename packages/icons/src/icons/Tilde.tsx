import type { IconProps } from '../types';

export function Tilde({
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
      <path d="M20.6144 10.3566C20.9694 10.1438 21.4305 10.2596 21.6437 10.6144C21.8565 10.9696 21.7409 11.4307 21.3859 11.6437L20.1515 12.384C17.5862 13.923 14.4121 14.0451 11.7364 12.7072L11.5929 12.635C9.37589 11.5266 6.74564 11.6273 4.62023 12.9025L3.38585 13.6437C3.03072 13.8566 2.56959 13.741 2.35656 13.3859C2.14395 13.0309 2.25945 12.5696 2.61437 12.3566L3.84874 11.6164C6.4139 10.0774 9.58814 9.95547 12.2638 11.2932L12.4073 11.3654C14.6244 12.4739 17.2545 12.3731 19.38 11.0978L20.6144 10.3566Z" fill={primary}/>
    </svg>
  );
}
