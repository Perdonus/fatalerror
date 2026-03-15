export function InstallCard({
  title,
  steps
}: {
  title: string;
  steps: string[];
}) {
  return (
    <section className="surface-card install-card">
      <div className="section-heading compact">
        <div className="eyebrow">Install</div>
        <h3>{title}</h3>
      </div>
      <ol className="number-list">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
