import Image from "next/image";
import "./BrandLogo.css";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-logo ${className}`}>
      <Image
        className="brand-logo-light"
        src="/images/yespiz-logo.svg"
        alt="Yespiz"
        width={164}
        height={52}
        priority
      />
      <Image
        className="brand-logo-dark"
        src="/images/yespiz-logo-dark.svg"
        alt="Yespiz"
        width={164}
        height={52}
        priority
      />
    </span>
  );
}
