"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import { ArrowRight } from "@repo/icons";
import { YespizzWordmark } from "@/assets/yespizz-wordmark";
import { APP_WEB_URL } from "@/content/app-links";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const f = landingContent.footer;

export interface FooterSectionLink {
  label: string;
  href: string;
}

export interface FooterSectionColumn {
  title: string;
  links: FooterSectionLink[];
}

export interface FooterSectionProps {
  logoIcon?: ReactNode;
  brandName?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  columns?: FooterSectionColumn[];
  heroBrandName?: string;
  copyrightText?: string;
  className?: string;
}

const defaultColumns: FooterSectionColumn[] = [
  {
    title: f.columns.product,
    links: [
      { label: f.links.menu, href: "#menu" },
      { label: f.links.app, href: "#download" },
      { label: f.links.pricing, href: "#pricing" },
      { label: f.links.tracking, href: "#tracking" },
    ],
  },
  {
    title: f.columns.company,
    links: [
      { label: f.links.about, href: "#about" },
      { label: f.links.blog, href: "#blog" },
      { label: f.links.careers, href: "#careers" },
      { label: f.links.contact, href: "#contact" },
    ],
  },
  {
    title: f.connect,
    links: [
      { label: "Twitter", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
  {
    title: f.columns.legal,
    links: [
      { label: f.links.privacy, href: "#privacy" },
      { label: f.links.terms, href: "#terms" },
      { label: f.links.imprint, href: "#imprint" },
    ],
  },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const navStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.02,
    },
  },
};

const riseItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.6, bounce: 0 },
  },
};

const linkStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const linkItem: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", duration: 0.4, bounce: 0 },
  },
};

const heroBrandVariant: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 1.1, bounce: 0 },
  },
};

const ctaVariant: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.5, bounce: 0 },
  },
};

export function FooterSection({
  logoIcon,
  brandName = "Yespizz",
  description = f.description,
  ctaLabel = f.download,
  ctaHref = APP_WEB_URL,
  columns = defaultColumns,
  heroBrandName = "YESPIZZ",
  copyrightText = f.copyright,
  className,
}: FooterSectionProps) {
  return (
    <footer
      className={cn(
        "footer-section landing-section--immersive relative w-full overflow-hidden",
        "rounded-t-[2.5rem] font-sans antialiased md:rounded-t-[3.5rem]",
        className,
      )}
    >
      <div className="footer-section__grid pointer-events-none absolute inset-0 z-0" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="relative z-10 px-6 pt-10 pb-0 sm:px-10 sm:pt-14 lg:px-14 lg:pt-16 xl:px-20"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-10 lg:flex-row lg:gap-16 xl:gap-20">
          <motion.div
            variants={riseItem}
            className="flex shrink-0 flex-col gap-5 lg:max-w-[260px] xl:max-w-[280px]"
          >
            <div className="flex items-center">
              {logoIcon ?? <YespizzWordmark width={132} />}
              <span className="sr-only">{brandName}</span>
            </div>

            <p className="text-sm leading-[1.6] font-bold text-pretty whitespace-pre-line text-(--section-muted)">
              {description}
            </p>

            <p className="text-[10px] font-bold tracking-[0.18em] text-brand-lime uppercase">
              {f.status}
            </p>

            <motion.a
              href={ctaHref}
              variants={ctaVariant}
              whileTap={{ scale: 0.96 }}
              className="group mt-1 inline-flex w-fit items-center gap-2.5 rounded-full bg-brand-lime py-0.5 pr-1 pl-5 shadow-lg transition-[background-color,box-shadow] duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15),0_0_20px_color-mix(in_oklab,var(--color-brand-lime)_30%,transparent)]"
            >
              <span className="text-sm font-black text-brand-olive uppercase">
                {ctaLabel}
              </span>
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-purple">
                <ArrowRight className="size-4 text-accent-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </motion.a>
          </motion.div>

          <motion.nav
            variants={navStagger}
            aria-label="Footer navigation"
            className="grid w-full max-w-[540px] grid-cols-2 gap-y-8 sm:grid-cols-4"
          >
            {columns.map((col) => (
              <motion.div key={col.title} variants={riseItem}>
                <h3 className="text-xs leading-none font-black tracking-[0.14em] text-balance text-accent-foreground uppercase">
                  {col.title}
                </h3>
                <motion.ul
                  variants={linkStagger}
                  className="mt-3 flex flex-col gap-3"
                >
                  {col.links.map((link) => (
                    <motion.li key={link.label} variants={linkItem}>
                      <a
                        href={link.href}
                        className="inline-block text-sm leading-none font-bold text-(--section-muted) transition-colors duration-200 hover:text-brand-lime"
                      >
                        {link.label}
                      </a>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            ))}
          </motion.nav>
        </div>
      </motion.div>

      <motion.div
        variants={heroBrandVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="relative z-10 flex flex-col items-center overflow-hidden px-4 pt-10 sm:px-6 sm:pt-14 md:pt-20"
      >
        <svg
          className="h-auto w-full translate-y-2 select-none md:translate-y-6"
          viewBox={`0 0 ${Math.max(heroBrandName.length * 90, 400)} 110`}
          preserveAspectRatio="xMidYMid meet"
          aria-label={heroBrandName}
        >
          <text
            x="50%"
            y="100%"
            dominantBaseline="alphabetic"
            textAnchor="middle"
            textLength="95%"
            lengthAdjust="spacing"
            className="hero-display-text fill-white font-black uppercase"
            fontSize="160"
          >
            {heroBrandName}
          </text>
        </svg>

        <p className="relative z-10 -mt-2 pb-8 text-center text-[10px] font-bold tracking-[0.12em] text-(--section-muted) uppercase md:pb-10">
          {copyrightText}
        </p>
      </motion.div>
    </footer>
  );
}
