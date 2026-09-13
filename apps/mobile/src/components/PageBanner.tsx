"use client";

import Image from "next/image";
import { Typography } from "@heroui/react";
import { useApp } from "@/context/AppContext";

export function PageBanner({ sharing = false }: { sharing?: boolean }) {
  const { language } = useApp();
  const de = language === "de";
  return (
    <section className="relative mt-6 overflow-hidden rounded-3xl bg-[#08111f]" aria-label={sharing ? (de ? "Pizza teilen" : "Share pizza") : (de ? "Pizza entdecken" : "Discover pizza")}>
      <Image src={`/images/banners/${sharing ? "pizza-sharing" : "pizza-editorial"}-v1.png`} alt={sharing ? "Two pizzas in open boxes, with a slice being shared" : "Fresh pepperoni pizza with a golden crust"} loading="eager" width={1536} height={1024} sizes="(max-width: 640px) 100vw, 600px" className="aspect-[1.8] w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08111f] via-[#08111f]/80 to-transparent px-5 pb-5 pt-12">
        <Typography type="h2" className="max-w-[260px] text-2xl font-bold leading-tight text-white">{sharing ? (de ? "Gute Pizza. Gute Gesellschaft." : "Good pizza. Great company.") : (de ? "Deine nächste Lieblingspizza." : "Your next favourite slice.")}</Typography>
      </div>
    </section>
  );
}
