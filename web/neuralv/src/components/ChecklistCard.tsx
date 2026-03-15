export function ChecklistCard({
  title,
  items,
  tone = 'default'
}: {
  title: string;
  items: string[];
  tone?: 'default' | 'accent';
}) {
  return (
    <section className={`surface-card checklist-card${tone === 'accent' ? ' accent' : ''}`}>
      <div className="section-heading compact">
        <div className="eyebrow">{tone === 'accent' ? 'Server side' : 'Local side'}</div>
        <h3>{title}</h3>
      </div>
      <ul className="bullet-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
