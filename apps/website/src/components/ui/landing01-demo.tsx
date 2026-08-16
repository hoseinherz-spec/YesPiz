import { FooterSection } from "./footer-section";
import { Hero } from "./hero";
import { LandingDownloadSection } from "./landing-download-section";
import { LandingFaqSection } from "./landing-faq-section";
import { LandingHeader } from "./landing-header";
import { LandingPizzaMenuSection } from "./landing-pizza-menu-section";
import { LandingTestimonialsSection } from "./landing-testimonials-section";
import { PizzaAnimation } from "./PizzaAnimation";

export default function Landing01Demo() {
  return (
    <main className="landing-page w-full max-w-full overflow-x-clip bg-surface-hover">
      <LandingHeader />
      <Hero />
      <PizzaAnimation
        eyebrow="From the oven"
        headline="Craft you can taste."
        description="Watch Neapolitan pizza leave the fire and settle into the box — dough, heat, and Vienna soul in every frame."
      />
      <LandingPizzaMenuSection />
      <LandingTestimonialsSection />
      <LandingFaqSection />
      <LandingDownloadSection />
      <FooterSection />
    </main>
  );
}
