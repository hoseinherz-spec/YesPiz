import Link from "next/link";
export function LandingTestimonialsSection() {
  return (
    <section
      id="promise"
      className="relative z-20 w-full rounded-b-[2.5rem] bg-surface px-6 py-16 text-foreground md:px-10 md:py-20"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-sm font-semibold text-muted">
            The Yespizz promise
          </p>
          <h2 className="mt-5 max-w-lg text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Your pizza.
            <br />
            <span className="landing-accent-copy">Our responsibility.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-muted">
            Choose the pizza you love. Follow your order, share feedback
            privately, and reach Yespizz whenever something needs attention.
          </p>
          <Link
            href="#menu"
            className="mt-8 inline-block rounded-full bg-brand-lime px-7 py-4 font-bold text-brand-olive"
          >
            Explore our pizzas
          </Link>
        </div>
        <div className="divide-y divide-border">
          {[
            [
              "01",
              "Made to a shared standard",
              "Ingredients, preparation and packaging follow the Yespizz standard.",
            ],
            [
              "02",
              "Keep up with your order",
              "See the latest delivery estimate and order progress in the app.",
            ],
            [
              "03",
              "A direct line to Yespizz",
              "Get help with your order, including after delivery. Your feedback stays private with our quality team.",
            ],
          ].map(([number, title, body]) => (
            <article key={number} className="flex gap-5 py-7 first:pt-0">
              <span className="pt-1 text-sm font-semibold text-muted">
                {number}
              </span>
              <div>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
