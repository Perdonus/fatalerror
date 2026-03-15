export type FeatureCard = {
  title: string;
  text: string;
};

export function FeatureGrid({ items }: { items: FeatureCard[] }) {
  return (
    <section className="feature-grid">
      {items.map((item) => (
        <article key={item.title} className="surface-card feature-card">
          <div className="eyebrow">NeuralV</div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </section>
  );
}
