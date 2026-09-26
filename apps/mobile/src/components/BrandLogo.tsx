import Image from "next/image";
import "./BrandLogo.css";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-logo ${className}`}>
      <Image
        className="brand-logo-wordmark"
        src="/images/yespizz-wordmark.svg"
        alt="Yespiz"
        width={300}
        height={100}
        priority
      />
    </span>
  );
}
