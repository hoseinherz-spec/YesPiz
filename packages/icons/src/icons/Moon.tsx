import type { IconProps } from '../types';

export function Moon({
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
      <path d="M9.11523 3.47461C9.03912 3.97194 9 4.48139 9 5C9 10.5228 13.4772 15 19 15C19.5187 15 20.028 14.9599 20.5254 14.8838C19.3231 18.4395 15.9616 21 12 21C7.02944 21 3 16.9706 3 12C3 8.03868 5.55996 4.6772 9.11523 3.47461Z" fill={primary} fillOpacity="0.2"/>
<path fillRule="evenodd" clipRule="evenodd" d="M8.875 2.76389C9.12292 2.68014 9.39717 2.73242 9.59766 2.90061C9.79793 3.06886 9.89588 3.32952 9.85645 3.58811C9.78612 4.04758 9.75001 4.51945 9.75 5.00021C9.75 10.1088 13.8914 14.2502 19 14.2502C19.48 14.2502 19.9516 14.2133 20.4121 14.1428C20.6707 14.1033 20.9313 14.2014 21.0996 14.4016C21.2679 14.602 21.32 14.8763 21.2363 15.1242C19.9342 18.9751 16.2933 21.7502 12 21.7502C6.61522 21.7502 2.25 17.385 2.25 12.0002C2.25011 7.70744 5.02471 4.06627 8.875 2.76389ZM8.25586 4.64963C5.58107 6.01425 3.7501 8.79346 3.75 12.0002C3.75 16.5566 7.44365 20.2502 12 20.2502C15.207 20.2502 17.9851 18.4185 19.3496 15.7434C19.2335 15.7471 19.117 15.7502 19 15.7502C13.0629 15.7502 8.25 10.9373 8.25 5.00021C8.25 4.88303 8.25215 4.76599 8.25586 4.64963Z" fill={primary}/>
    </svg>
  );
}
