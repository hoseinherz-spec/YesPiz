import type { IconProps } from '../types';

export function NumberBinary({
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
      <path d="M17.3157 1.52163C17.7031 1.57144 18.0586 1.77178 18.303 2.08218C18.5442 2.38886 18.5896 2.73682 18.6067 2.92397C18.6251 3.12689 18.6243 3.37593 18.6243 3.61538V9.00015H19.9993C20.5515 9.00015 20.9992 9.44793 20.9993 10.0001C20.9993 10.5524 20.5515 11.0001 19.9993 11.0001H14.9993C14.4472 10.9999 13.9993 10.5523 13.9993 10.0001C13.9993 9.44809 14.4473 9.00041 14.9993 9.00015H16.6243V4.0187L15.6057 4.79604C15.1664 5.13054 14.538 5.04579 14.2034 4.60659C13.869 4.16739 13.9539 3.53892 14.3928 3.20425L15.7336 2.18374C15.9241 2.03865 16.1216 1.88676 16.2942 1.77847C16.4533 1.67867 16.7576 1.50402 17.1477 1.50991L17.3157 1.52163Z" fill={secondary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M6.5 13C8.98528 13 11 15.0147 11 17.5C11 19.9853 8.98528 22 6.5 22C4.01472 22 2 19.9853 2 17.5C2 15.0147 4.01472 13 6.5 13ZM6.5 15C5.11929 15 4 16.1193 4 17.5C4 18.8807 5.11929 20 6.5 20C7.88071 20 9 18.8807 9 17.5C9 16.1193 7.88071 15 6.5 15Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M17.5 13C19.9853 13 22 15.0147 22 17.5C22 19.9853 19.9853 22 17.5 22C15.0147 22 13 19.9853 13 17.5C13 15.0147 15.0147 13 17.5 13ZM17.5 15C16.1193 15 15 16.1193 15 17.5C15 18.8807 16.1193 20 17.5 20C18.8807 20 20 18.8807 20 17.5C20 16.1193 18.8807 15 17.5 15Z" fill={primary}/>
<path fillRule="evenodd" clipRule="evenodd" d="M6.5 2C8.98528 2 11 4.01472 11 6.5C11 8.98528 8.98528 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2ZM6.5 4C5.11929 4 4 5.11929 4 6.5C4 7.88071 5.11929 9 6.5 9C7.88071 9 9 7.88071 9 6.5C9 5.11929 7.88071 4 6.5 4Z" fill={primary}/>
    </svg>
  );
}
