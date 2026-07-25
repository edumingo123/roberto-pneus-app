/** Standard WhatsApp templates + supported variables */

export const TEMPLATE_VARIABLES = [
  { key: "nome_cliente", label: "Nome do cliente", example: "João da Silva" },
  { key: "placa", label: "Placa", example: "ABC1D23" },
  { key: "veiculo", label: "Veículo", example: "Hyundai HB20" },
  { key: "numero_os", label: "Número da OS", example: "1042" },
  { key: "status", label: "Status", example: "Em execução" },
  { key: "valor_total", label: "Valor total", example: "1.750,00" },
  { key: "previsao", label: "Previsão", example: "25/07 às 17h" },
  { key: "link_os", label: "Link da OS", example: "https://app.../acompanhamento/..." },
  { key: "mecanico", label: "Mecânico", example: "Carlos" },
  { key: "data", label: "Data", example: "25/07/2026" },
  { key: "horario", label: "Horário", example: "14:30" },
  // aliases used in older code
  { key: "cliente_nome", label: "Nome (alias)", example: "João da Silva" },
  { key: "os_numero", label: "Nº OS (alias)", example: "1042" },
  { key: "link_publico", label: "Link (alias)", example: "https://..." },
  { key: "total", label: "Total (alias)", example: "1.750,00" },
  { key: "oficina_nome", label: "Oficina", example: "Roberto Pneus" },
  { key: "data_hora", label: "Data/hora", example: "25/07/2026 14:30" },
] as const;

export interface DefaultTemplateDef {
  key: string;
  name: string;
  description: string;
  body: string;
}

export const DEFAULT_WHATSAPP_TEMPLATES: DefaultTemplateDef[] = [
  {
    key: "orcamento_pronto",
    name: "Orçamento pronto",
    description: "Enviado quando o orçamento está disponível",
    body: "Olá {{nome_cliente}}! O orçamento da OS #{{numero_os}} ({{placa}} — {{veiculo}}) está pronto. Total: *R$ {{valor_total}}*. Confira e aprove: {{link_os}}",
  },
  {
    key: "orcamento_aprovado",
    name: "Orçamento aprovado",
    description: "Confirmação após aprovação do cliente",
    body: "Olá {{nome_cliente}}! Orçamento da OS #{{numero_os}} *aprovado*. Já estamos preparando o serviço no {{veiculo}} ({{placa}}). Acompanhe: {{link_os}}",
  },
  {
    key: "os_em_execucao",
    name: "OS em execução",
    description: "Quando o serviço é iniciado",
    body: "Olá {{nome_cliente}}! A OS #{{numero_os}} do {{veiculo}} ({{placa}}) está *em execução*. Mecânico: {{mecanico}}. Acompanhe: {{link_os}}",
  },
  {
    key: "os_quality_check",
    name: "Quality Check",
    description: "Controle de qualidade",
    body: "Olá {{nome_cliente}}! A OS #{{numero_os}} ({{placa}}) está em *controle de qualidade*. Em breve seu veículo estará pronto. {{link_os}}",
  },
  {
    key: "os_pronto_retirada",
    name: "Pronto para retirada",
    description: "Veículo liberado",
    body: "Olá {{nome_cliente}}! Seu {{veiculo}} ({{placa}}) está *pronto para retirada*. OS #{{numero_os}}. {{link_os}}",
  },
  {
    key: "agendamento_confirmado",
    name: "Agendamento confirmado",
    description: "Confirmação de horário",
    body: "Olá {{nome_cliente}}! Agendamento confirmado para *{{data}}* às *{{horario}}*. Veículo: {{placa}}. Acompanhe: {{link_os}}",
  },
  {
    key: "lembrete_manutencao",
    name: "Lembrete de manutenção preventiva",
    description: "Aviso de manutenção por KM/data",
    body: "Olá {{nome_cliente}}! O {{veiculo}} ({{placa}}) está próximo da manutenção preventiva. Agende conosco. Previsão: {{previsao}}.",
  },
  {
    key: "pedido_pneu_recebido",
    name: "Pedido de pneu recebido",
    description: "Confirmação de interesse em pneus",
    body: "Olá {{nome_cliente}}! Recebemos seu pedido de pneus para o {{veiculo}} ({{placa}}). Em breve retornamos com disponibilidade e valores.",
  },
  // legacy aliases kept active for existing code paths
  {
    key: "os_status_change",
    name: "Mudança de status (genérico)",
    description: "Fallback genérico de status",
    body: "Olá {{nome_cliente}}! A OS #{{numero_os}} do veículo {{placa}} está agora: *{{status}}*. Acompanhe: {{link_os}}",
  },
  {
    key: "os_budget",
    name: "Orçamento (alias)",
    description: "Alias de orçamento pronto",
    body: "Olá {{nome_cliente}}! Orçamento OS #{{numero_os}} ({{placa}}): Total *R$ {{valor_total}}*. Aprove: {{link_os}}",
  },
  {
    key: "os_ready",
    name: "Pronto (alias)",
    description: "Alias de pronto para retirada",
    body: "Olá {{nome_cliente}}! Seu veículo {{placa}} está *pronto para retirada*. OS #{{numero_os}}. {{link_os}}",
  },
  {
    key: "appointment_confirmation",
    name: "Agendamento (alias)",
    description: "Alias de agendamento confirmado",
    body: "Olá {{nome_cliente}}! Agendamento confirmado: {{data_hora}}. Acompanhe: {{link_os}}",
  },
];

/** Map OS status → template key */
export function templateKeyForOsStatus(status: string): string {
  switch (status) {
    case "ORCAMENTO":
      return "orcamento_pronto";
    case "APROVADO":
      return "orcamento_aprovado";
    case "EM_EXECUCAO":
      return "os_em_execucao";
    case "QUALITY_CHECK":
      return "os_quality_check";
    case "PRONTO_RETIRADA":
      return "os_pronto_retirada";
    default:
      return "os_status_change";
  }
}
