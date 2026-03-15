import { ManifestState } from '../hooks/useReleaseManifest';

export function ManifestBanner({ loading, source, error }: ManifestState) {
  if (loading) {
    return (
      <section className="manifest-banner surface-card subtle">
        <div>
          <div className="eyebrow">Release manifest</div>
          <p>Загружаем актуальные артефакты и install-команды.</p>
        </div>
        <md-circular-progress indeterminate />
      </section>
    );
  }

  if (source === 'fallback') {
    return (
      <section className="manifest-banner surface-card warning">
        <div>
          <div className="eyebrow">Release manifest</div>
          <p>Используется fallback-конфигурация. {error ?? 'Backend manifest пока недоступен.'}</p>
        </div>
        <md-outlined-button href="/basedata/health">Проверить backend</md-outlined-button>
      </section>
    );
  }

  return (
    <section className="manifest-banner surface-card success">
      <div>
        <div className="eyebrow">Release manifest</div>
        <p>Сайт читает живые артефакты напрямую из backend release manifest.</p>
      </div>
      <md-filled-tonal-button href="/basedata/api/releases/manifest">Открыть JSON</md-filled-tonal-button>
    </section>
  );
}
