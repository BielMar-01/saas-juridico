import { CheckIcon, ClockIcon, DocumentIcon } from "./icons";

export function ProductPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`product-preview${compact ? " product-preview-compact" : ""}`}>
      <div className="demo-label">Demonstração fictícia</div>
      <div className="preview-window">
        <div className="preview-sidebar" aria-hidden="true">
          <strong>JV</strong>
          <span className="active" />
          <span />
          <span />
          <span />
        </div>
        <div className="preview-main">
          <div className="preview-topline">
            <div>
              <span className="preview-eyebrow">Caso fictício</span>
              <strong>Revisão contratual</strong>
            </div>
            <span className="status status-progress">Em andamento</span>
          </div>
          <div className="preview-summary">
            <div>
              <span>Responsável</span>
              <strong>Equipe Contratos</strong>
            </div>
            <div>
              <span>Próximo passo</span>
              <strong>Validar minuta</strong>
            </div>
            <div>
              <span>Prazo interno</span>
              <strong>18 out.</strong>
            </div>
          </div>
          <div className="preview-grid">
            <div className="preview-list">
              <span className="preview-section-title">Atividades</span>
              <div className="preview-row">
                <span className="preview-icon complete"><CheckIcon /></span>
                <div><strong>Documentos recebidos</strong><span>Concluído pela equipe</span></div>
              </div>
              <div className="preview-row">
                <span className="preview-icon"><ClockIcon /></span>
                <div><strong>Revisar cláusulas</strong><span>Em análise</span></div>
              </div>
              <div className="preview-row">
                <span className="preview-icon"><DocumentIcon /></span>
                <div><strong>Preparar retorno</strong><span>Próxima etapa</span></div>
              </div>
            </div>
            <div className="next-step-card">
              <span>Próximo passo</span>
              <strong>Validar a minuta revisada</strong>
              <p>A equipe confere os pontos antes de liberar uma atualização.</p>
              <div className="readiness"><i /> Em preparação</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
