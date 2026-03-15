export type ComparisonRow = {
  label: string;
  android: string;
  windows: string;
  linux: string;
};

export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  return (
    <section className="surface-card table-card">
      <div className="section-heading">
        <div className="eyebrow">Сравнение платформ</div>
        <h3>Что делает каждая версия</h3>
      </div>
      <div className="comparison-table" role="table" aria-label="Сравнение платформ NeuralV">
        <div className="table-header" role="rowgroup">
          <div role="row">
            <span role="columnheader">Сценарий</span>
            <span role="columnheader">Android</span>
            <span role="columnheader">Windows</span>
            <span role="columnheader">Linux</span>
          </div>
        </div>
        <div className="table-body" role="rowgroup">
          {rows.map((row) => (
            <div key={row.label} role="row" className="table-row">
              <span role="cell">{row.label}</span>
              <span role="cell">{row.android}</span>
              <span role="cell">{row.windows}</span>
              <span role="cell">{row.linux}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
