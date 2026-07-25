export type UserRole = "ADMIN" | "MECANICO" | "RECEPCIONISTA";

export interface SessionUser {
  id: string;
  authUserId: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: UserRole[];
  badge?: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MECANICO: "Mecânico",
  RECEPCIONISTA: "Recepcionista",
};

export const SERVICE_ORDER_STATUS_LABELS: Record<string, string> = {
  ORCAMENTO: "Orçamento",
  APROVADO: "Aprovado",
  EM_EXECUCAO: "Em execução",
  QUALITY_CHECK: "Controle de qualidade",
  PRONTO_RETIRADA: "Pronto para retirada",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  CONFIRMADO: "Confirmado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
  NAO_COMPARECEU: "Não compareceu",
};
