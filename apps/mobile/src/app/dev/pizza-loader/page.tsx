import { PizzaLoader } from "@/components/PizzaLoader";
export default function PizzaLoaderPreview() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: 32,
      }}
    >
      <h1>Pizza loader</h1>
      <PizzaLoader size="lg" label="Preparing your pizza…" showLabel />
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <PizzaLoader size="sm" />
        <PizzaLoader size="md" />
      </div>
      <div data-still style={{ textAlign: "center" }}>
        <PizzaLoader size="lg" label="Assembled · reduced motion" showLabel />
      </div>
      <style>{`[data-still] img {animation:none;opacity:1;transform:none;} [data-still] [aria-hidden="true"] {animation:none;}`}</style>
    </main>
  );
}
