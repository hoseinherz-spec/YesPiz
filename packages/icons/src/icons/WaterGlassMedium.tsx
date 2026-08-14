import type { IconProps } from '../types';

export function WaterGlassMedium({
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
      <path d="M18 11.75H14.4141C13.7075 11.75 13.0299 12.0307 12.5303 12.5303C11.7494 13.3112 10.6903 13.75 9.58594 13.75H6V12.25H9.58594C10.2925 12.25 10.9701 11.9693 11.4697 11.4697C12.2506 10.6888 13.3097 10.25 14.4141 10.25H18V11.75Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M19.0007 2.25C19.2139 2.25008 19.4171 2.34112 19.5593 2.5C19.7015 2.65894 19.7693 2.87105 19.7458 3.08301L17.7458 21.083C17.7035 21.4626 17.3826 21.7499 17.0007 21.75H7.00069C6.61861 21.75 6.29788 21.4627 6.25557 21.083L4.25557 3.08301C4.23201 2.87098 4.29982 2.65896 4.44209 2.5C4.58436 2.34114 4.78743 2.25 5.00069 2.25H19.0007ZM7.67159 20.25H16.3298L18.1628 3.75H5.83858L7.67159 20.25Z" fill={primary}/>
    </svg>
  );
}
