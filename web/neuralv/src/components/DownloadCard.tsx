import { ReleaseArtifact } from '../lib/manifest';

export function DownloadCard({
  title,
  description,
  artifact,
  secondaryLabel
}: {
  title: string;
  description: string;
  artifact?: ReleaseArtifact;
  secondaryLabel?: string;
}) {
  const hasDownload = Boolean(artifact?.downloadUrl);
  const version = artifact?.version ?? 'pending';

  return (
    <article className="surface-card download-card">
      <div className="section-heading compact">
        <div className="eyebrow">{title}</div>
        <h3>{version}</h3>
      </div>
      <p>{description}</p>
      {artifact?.sha256 && <p className="muted mono">SHA256: {artifact.sha256}</p>}
      {artifact?.installCommand && (
        <pre className="command-block">
          <code>{artifact.installCommand}</code>
        </pre>
      )}
      <div className="download-actions">
        {hasDownload ? (
          <a href={artifact?.downloadUrl} target="_blank" rel="noreferrer">
            <md-filled-button>{secondaryLabel ?? 'Скачать'}</md-filled-button>
          </a>
        ) : (
          <md-outlined-button disabled>{secondaryLabel ?? 'Скоро'}</md-outlined-button>
        )}
      </div>
      {artifact?.notes?.length ? (
        <ul className="bullet-list muted">
          {artifact.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
