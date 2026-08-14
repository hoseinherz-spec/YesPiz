import type { IconProps } from '../types';

export function BluetoothSlash({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M5.46959 5.46979C5.67548 5.26413 5.97015 5.20655 6.22936 5.2901L17.701 16.7618C17.6593 16.8738 17.5925 16.976 17.5018 17.0577L12.5018 21.5577C12.2818 21.7557 11.9656 21.8058 11.6952 21.6856C11.4246 21.5651 11.2499 21.2962 11.2499 21.0001V13.8106L6.53014 18.5303C6.23725 18.8232 5.76248 18.8232 5.46959 18.5303C5.17686 18.2374 5.17675 17.7626 5.46959 17.4698L10.9393 12.0001L5.46959 6.53033C5.17686 6.23743 5.17675 5.76263 5.46959 5.46979ZM12.7499 19.3155L15.8778 16.5001L12.7499 13.6837V19.3155Z" fill={primary}/>
<path d="M11.6952 2.31451C11.9655 2.1945 12.2819 2.24462 12.5018 2.44244L17.5018 6.94244C17.6597 7.08457 17.7497 7.28764 17.7499 7.50006C17.7499 7.71251 17.6596 7.91546 17.5018 8.05768L14.1415 11.0811L13.079 10.0186L15.8778 7.50006L12.7499 4.68365V9.68951L11.2499 8.18951V3.00006C11.25 2.70406 11.4248 2.43495 11.6952 2.31451Z" fill={primary}/>
<path d="M2.46967 2.46967C2.76256 2.17678 3.23732 2.17678 3.53022 2.46967L21.5302 20.4697C21.8231 20.7626 21.8231 21.2373 21.5302 21.5302C21.2373 21.8231 20.7626 21.8231 20.4697 21.5302L2.46967 3.53022C2.17678 3.23732 2.17678 2.76256 2.46967 2.46967Z" fill={secondary}/>
    </svg>
  );
}
