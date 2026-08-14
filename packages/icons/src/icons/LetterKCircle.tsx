import type { IconProps } from '../types';

export function LetterKCircle({
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
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25ZM12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75Z" fill={primary}/>
<path d="M14.376 6.58402C14.6057 6.23942 15.0714 6.14629 15.416 6.37601C15.7606 6.60577 15.8537 7.07141 15.624 7.41605L13.2148 11.0293C12.9606 11.4106 12.6436 11.7364 12.2842 12C12.6436 12.2637 12.9606 12.5894 13.2148 12.9707L15.624 16.584C15.8538 16.9287 15.7606 17.3943 15.416 17.6241C15.0714 17.8538 14.6057 17.7607 14.376 17.4161L11.9668 13.8028C11.6717 13.3602 11.241 13.0365 10.75 12.8721V17C10.75 17.4143 10.4142 17.75 10 17.75C9.58579 17.75 9.25 17.4143 9.25 17V7.00004C9.25004 6.58586 9.58581 6.25004 10 6.25004C10.4142 6.25004 10.75 6.58586 10.75 7.00004V11.127C11.2409 10.9626 11.6718 10.6398 11.9668 10.1973L14.376 6.58402Z" fill={secondary}/>
    </svg>
  );
}
