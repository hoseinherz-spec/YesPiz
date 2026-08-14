import type { IconProps } from '../types';

export function Knife({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M21.9697 17.9092C22.8483 18.7878 22.8483 20.2122 21.9697 21.0908L21.5908 21.4697C20.7122 22.3483 19.2878 22.3483 18.4092 21.4697L12.9395 16L16.5 12.4395L21.9697 17.9092ZM15.0605 16L19.4697 20.4092C19.7626 20.7019 20.2374 20.7019 20.5303 20.4092L20.9092 20.0303C21.2019 19.7374 21.2019 19.2626 20.9092 18.9697L16.5 14.5605L15.0605 16Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M1.08282 2.25462L1.71563 2.32493C7.30111 2.94564 12.5094 5.44874 16.4832 9.42258L18.5301 11.4695C18.8228 11.7624 18.8229 12.2372 18.5301 12.53L14.8836 16.1765C14.3955 16.6645 13.6042 16.6644 13.116 16.1765L0.469537 3.53001C0.244355 3.30482 0.186153 2.96158 0.32403 2.67454C0.46208 2.38765 0.766369 2.21945 1.08282 2.25462ZM13.9998 14.9392L16.9393 11.9997L15.4227 10.4831C12.0605 7.12097 7.75744 4.87989 3.10235 4.04173L13.9998 14.9392Z" fill={primary}/>
    </svg>
  );
}
