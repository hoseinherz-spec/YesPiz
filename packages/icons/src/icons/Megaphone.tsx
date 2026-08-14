import type { IconProps } from '../types';

export function Megaphone({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M19.5312 3.62928C20.6461 3.31968 21.7496 4.15789 21.75 5.31483V16.684C21.7499 17.8412 20.6463 18.6792 19.5312 18.3695L10.75 15.9301V17.9994C10.75 19.5182 9.51878 20.7494 8 20.7494C6.48122 20.7494 5.25 19.5182 5.25 17.9994V14.4017L4.72656 14.2572C3.26314 13.8507 2.25 12.5183 2.25 10.9994C2.25019 9.48068 3.26322 8.14807 4.72656 7.74159L19.5312 3.62928ZM6.75 17.9994C6.75 18.6898 7.30964 19.2494 8 19.2494C8.69035 19.2494 9.25 18.6898 9.25 17.9994V15.5131L6.75 14.8187V17.9994ZM19.9326 5.0746L5.12793 9.1869C4.31381 9.41305 3.75019 10.1545 3.75 10.9994C3.75 11.8444 4.31373 12.5857 5.12793 12.8119L19.9326 16.9242C20.0918 16.9684 20.2499 16.8492 20.25 16.684V5.31483C20.2496 5.14987 20.0917 5.03049 19.9326 5.0746Z" fill={primary}/>
<path d="M10.75 15H9.25V7H10.75V15Z" fill={secondary}/>
    </svg>
  );
}
