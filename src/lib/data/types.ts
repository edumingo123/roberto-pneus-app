export type Gender =
  | "MASCULINO"
  | "FEMININO"
  | "OUTRO"
  | "NAO_INFORMADO";

export type ClientStatus = "ATIVO" | "INATIVO";

export type FuelType =
  | "GASOLINA"
  | "ETANOL"
  | "FLEX"
  | "DIESEL"
  | "GNV"
  | "ELETRICO"
  | "HIBRIDO"
  | "OUTRO";

export type TransmissionType =
  | "MANUAL"
  | "AUTOMATICO"
  | "CVT"
  | "AUTOMATIZADO"
  | "OUTRO";

export type UserRole = "ADMIN" | "MECANICO" | "RECEPCIONISTA";

export interface ClientRecord {
  id: string;
  tenantId: string;
  name: string;
  document: string;
  whatsapp: string;
  email: string | null;
  birthDate: string | null; // ISO date
  gender: Gender;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string | null;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  notes: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRecord {
  id: string;
  tenantId: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  yearManufacture: number;
  yearModel: number;
  color: string;
  currentKm: number;
  chassis: string | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  engine: string | null;
  power: string | null;
  engineCode: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDocumentRecord {
  id: string;
  tenantId: string;
  vehicleId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  sizeBytes: number | null;
  createdAt: string;
}

export interface MaintenanceTypeRecord {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  defaultKm: number | null;
  defaultDays: number | null;
  intervalType: "KM" | "DIAS" | "AMBOS";
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenancePlanRecord {
  id: string;
  tenantId: string;
  vehicleId: string;
  maintenanceTypeId: string;
  lastServiceAt: string | null;
  lastServiceKm: number | null;
  nextDueAt: string | null;
  nextDueKm: number | null;
  intervalKm: number | null;
  intervalDays: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  tenantId: string;
  authUserId: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  specialty: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  tempPassword?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | "AGUARDANDO_APROVACAO"
  | "CONFIRMADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "NAO_COMPARECEU";

export type ServiceOrderStatus =
  | "ORCAMENTO"
  | "APROVADO"
  | "EM_EXECUCAO"
  | "QUALITY_CHECK"
  | "PRONTO_RETIRADA"
  | "ENTREGUE"
  | "CANCELADO";

export type PhotoType = "ANTES" | "DEPOIS" | "DIAGNOSTICO" | "PECA" | "OUTRO";

export interface AppointmentRecord {
  id: string;
  tenantId: string;
  clientId: string;
  vehicleId: string | null;
  mechanicId: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  createdByAi: boolean;
  publicToken: string | null;
  notes: string | null;
  serviceOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDetail extends AppointmentRecord {
  client: Pick<ClientRecord, "id" | "name" | "whatsapp" | "document">;
  vehicle: Pick<
    VehicleRecord,
    "id" | "plate" | "brand" | "model" | "color" | "currentKm"
  > | null;
  mechanic: Pick<UserRecord, "id" | "name" | "avatarUrl" | "specialty"> | null;
}

export interface ServiceOrderPartRecord {
  id: string;
  serviceOrderId: string;
  description: string;
  brand: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderLaborRecord {
  id: string;
  serviceOrderId: string;
  description: string;
  hours: number;
  hourlyRate: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderPhotoRecord {
  id: string;
  serviceOrderId: string;
  url: string;
  caption: string;
  type: PhotoType;
  createdAt: string;
}

export interface ServiceOrderStatusHistoryRecord {
  id: string;
  serviceOrderId: string;
  fromStatus: ServiceOrderStatus | null;
  toStatus: ServiceOrderStatus;
  changedById: string | null;
  changedByName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ServiceOrderRecord {
  id: string;
  tenantId: string;
  number: number;
  clientId: string;
  vehicleId: string;
  mechanicId: string | null;
  createdById: string | null;
  status: ServiceOrderStatus;
  kmAtEntry: number;
  kmAtExit: number | null;
  complaint: string | null;
  diagnosis: string | null;
  internalNotes: string | null;
  discount: number;
  partsTotal: number;
  laborTotal: number;
  grandTotal: number;
  publicToken: string;
  estimatedReady: string | null;
  approvedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderDetail extends ServiceOrderRecord {
  client: Pick<
    ClientRecord,
    "id" | "name" | "whatsapp" | "document" | "email"
  >;
  vehicle: Pick<
    VehicleRecord,
    | "id"
    | "plate"
    | "brand"
    | "model"
    | "color"
    | "yearModel"
    | "currentKm"
  >;
  mechanic: Pick<UserRecord, "id" | "name" | "avatarUrl" | "specialty"> | null;
  parts: ServiceOrderPartRecord[];
  laborItems: ServiceOrderLaborRecord[];
  photos: ServiceOrderPhotoRecord[];
  statusHistory: ServiceOrderStatusHistoryRecord[];
}

export interface ServiceOrderListItem extends ServiceOrderRecord {
  clientName: string;
  vehiclePlate: string;
  vehicleLabel: string;
  mechanicName: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WhatsAppTemplateRecord {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  body: string;
  isActive: boolean;
  description?: string | null;
  updatedAt?: string;
}

export type WhatsAppMessageStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED";

export interface WhatsAppMessageLogRecord {
  id: string;
  tenantId: string;
  toPhone: string;
  templateKey: string | null;
  body: string;
  status: WhatsAppMessageStatus;
  externalId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MessageChannel = "APP_CHAT" | "WHATSAPP" | "AI_AGENT";

export interface ChatConversationRecord {
  id: string;
  tenantId: string;
  serviceOrderId: string;
  clientId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  senderUserId: string | null;
  senderName: string;
  isFromClient: boolean;
  content: string | null;
  imageUrl: string | null;
  channel: MessageChannel;
  readAt: string | null;
  createdAt: string;
}

export interface ChatConversationListItem extends ChatConversationRecord {
  clientName: string;
  clientWhatsapp: string;
  osNumber: number;
  vehiclePlate: string;
  mechanicId: string | null;
  mechanicName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatTypingState {
  conversationId: string;
  userId: string;
  userName: string;
  isFromClient: boolean;
  expiresAt: number;
}

export interface AppNotificationRecord {
  id: string;
  tenantId: string;
  userId: string | null; // null = all staff of tenant
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export type TireType =
  | "PASSEIO"
  | "SUV"
  | "CAMINHONETE"
  | "CORRIDA"
  | "OFF_ROAD"
  | "COMERCIAL"
  | "MOTO"
  | "OUTRO";

export interface TireRecord {
  id: string;
  tenantId: string;
  brand: string;
  model: string;
  size: string;
  width: number | null;
  aspectRatio: number | null;
  rimDiameter: number | null;
  loadIndex: string | null;
  speedRating: string | null;
  type: TireType;
  season: string | null;
  price: number;
  promoPrice: number | null;
  isPromo: boolean;
  stockQty: number;
  minStock: number;
  sku: string | null;
  description: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  compatibleMakes: string[];
  compatibleModels: string[]; // e.g. "Honda Civic 2020"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TireInterestType = "ORCAMENTO" | "COMPRA";

export interface TireInterestRecord {
  id: string;
  tenantId: string;
  tireId: string;
  quantity: number;
  type: TireInterestType;
  clientName: string | null;
  clientPhone: string | null;
  notes: string | null;
  status: "NOVO" | "EM_ATENDIMENTO" | "CONCLUIDO" | "CANCELADO";
  createdAt: string;
}

export interface AiConversationRecord {
  id: string;
  tenantId: string;
  phone: string;
  clientName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessageRecord {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  functionCalls: unknown | null;
  createdAt: string;
}

export interface ClientWithVehicles extends ClientRecord {
  vehicles: VehicleRecord[];
  _count?: { vehicles: number };
}

export interface VehicleWithClient extends VehicleRecord {
  client: Pick<ClientRecord, "id" | "name" | "whatsapp" | "document">;
  documents?: VehicleDocumentRecord[];
}

export interface ClientDetail extends ClientRecord {
  vehicles: VehicleWithPlans[];
}

export interface VehicleWithPlans extends VehicleRecord {
  documents: VehicleDocumentRecord[];
  maintenancePlans: (MaintenancePlanRecord & {
    maintenanceType: Pick<MaintenanceTypeRecord, "id" | "name">;
  })[];
}
