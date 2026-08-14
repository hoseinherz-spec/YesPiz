"use client";

import * as React from "react";
import { Accordion as HeroAccordion } from "@heroui/react";
import { ChevronDown } from "@repo/icons";

import { cn } from "@/lib/utils";

type AccordionProps = React.ComponentProps<typeof HeroAccordion> & {
  type?: "single" | "multiple";
  collapsible?: boolean;
};

function Accordion({
  type = "single",
  className,
  children,
  ...props
}: AccordionProps) {
  return (
    <HeroAccordion
      className={className}
      allowsMultipleExpanded={type === "multiple"}
      {...props}
    >
      {children}
    </HeroAccordion>
  );
}

type AccordionItemProps = React.ComponentProps<typeof HeroAccordion.Item> & {
  value: string;
};

function AccordionItem({
  value,
  className,
  children,
  ...props
}: AccordionItemProps) {
  return (
    <HeroAccordion.Item id={value} className={className} {...props}>
      {children}
    </HeroAccordion.Item>
  );
}

type AccordionTriggerProps = Omit<
  React.ComponentProps<typeof HeroAccordion.Trigger>,
  "children"
> & {
  children?: React.ReactNode;
};

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  return (
    <HeroAccordion.Heading>
      <HeroAccordion.Trigger className={className} {...props}>
        {children}
        <HeroAccordion.Indicator className="text-muted [&>svg]:size-4">
          <ChevronDown size={16} />
        </HeroAccordion.Indicator>
      </HeroAccordion.Trigger>
    </HeroAccordion.Heading>
  );
}

type AccordionContentProps = React.ComponentProps<typeof HeroAccordion.Body>;

function AccordionContent({
  className,
  children,
  ...props
}: AccordionContentProps) {
  return (
    <HeroAccordion.Panel>
      <HeroAccordion.Body className={className} {...props}>
        {children}
      </HeroAccordion.Body>
    </HeroAccordion.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
