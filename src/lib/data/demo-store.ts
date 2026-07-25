import { randomUUID } from "crypto";
import type {
  AiConversationRecord,
  AiMessageRecord,
  AppointmentRecord,
  AppNotificationRecord,
  ChatConversationRecord,
  ChatMessageRecord,
  ChatTypingState,
  ClientRecord,
  MaintenancePlanRecord,
  MaintenanceTypeRecord,
  ServiceOrderLaborRecord,
  ServiceOrderPartRecord,
  ServiceOrderPhotoRecord,
  ServiceOrderRecord,
  ServiceOrderStatusHistoryRecord,
  TireInterestRecord,
  TireRecord,
  UserRecord,
  VehicleDocumentRecord,
  VehicleRecord,
  WhatsAppMessageLogRecord,
  WhatsAppTemplateRecord,
} from "./types";
import { DEFAULT_WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates-catalog";
import { seedDemoTires } from "./tires-seed";

const DEMO_TENANT = "demo-tenant";

export interface DemoStore {
  clients: ClientRecord[];
  vehicles: VehicleRecord[];
  vehicleDocuments: VehicleDocumentRecord[];
  maintenanceTypes: MaintenanceTypeRecord[];
  maintenancePlans: MaintenancePlanRecord[];
  users: UserRecord[];
  appointments: AppointmentRecord[];
  serviceOrders: ServiceOrderRecord[];
  serviceOrderParts: ServiceOrderPartRecord[];
  serviceOrderLabor: ServiceOrderLaborRecord[];
  serviceOrderPhotos: ServiceOrderPhotoRecord[];
  serviceOrderHistory: ServiceOrderStatusHistoryRecord[];
  whatsappTemplates: WhatsAppTemplateRecord[];
  whatsappLogs: WhatsAppMessageLogRecord[];
  chatConversations: ChatConversationRecord[];
  chatMessages: ChatMessageRecord[];
  chatTyping: ChatTypingState[];
  notifications: AppNotificationRecord[];
  tires: TireRecord[];
  tireInterests: TireInterestRecord[];
  aiConversations: AiConversationRecord[];
  aiMessages: AiMessageRecord[];
  nextOsNumber: number;
}

const globalForDemo = globalThis as unknown as {
  __rpDemoStore?: DemoStore;
};

function now() {
  return new Date().toISOString();
}

function seedMaintenanceTypes(): MaintenanceTypeRecord[] {
  const ts = now();
  const defs: Array<{
    name: string;
    description: string;
    defaultKm: number | null;
    defaultDays: number | null;
  }> = [
    {
      name: "Troca de Óleo do Motor",
      description: "Troca de óleo e filtro do motor",
      defaultKm: 10000,
      defaultDays: 180,
    },
    {
      name: "Troca de Óleo do Câmbio",
      description: "Troca de fluido de transmissão",
      defaultKm: 40000,
      defaultDays: 730,
    },
    {
      name: "Correia Dentada",
      description: "Substituição da correia dentada e tensionadores",
      defaultKm: 60000,
      defaultDays: 1460,
    },
    {
      name: "Fluido de Freio",
      description: "Troca do fluido de freio",
      defaultKm: 30000,
      defaultDays: 730,
    },
    {
      name: "Líquido de Arrefecimento",
      description: "Troca do líquido de arrefecimento",
      defaultKm: 40000,
      defaultDays: 730,
    },
    {
      name: "Alinhamento e Balanceamento",
      description: "Alinhamento e balanceamento de rodas",
      defaultKm: 10000,
      defaultDays: 180,
    },
    {
      name: "Suspensão",
      description: "Revisão de amortecedores e componentes",
      defaultKm: 40000,
      defaultDays: 730,
    },
    {
      name: "Filtro de Ar",
      description: "Troca do filtro de ar do motor",
      defaultKm: 15000,
      defaultDays: 365,
    },
    {
      name: "Filtro de Combustível",
      description: "Troca do filtro de combustível",
      defaultKm: 20000,
      defaultDays: 365,
    },
    {
      name: "Velas de Ignição",
      description: "Substituição das velas",
      defaultKm: 30000,
      defaultDays: 730,
    },
    {
      name: "Pneus / Rodízio",
      description: "Rodízio e inspeção de pneus",
      defaultKm: 10000,
      defaultDays: 180,
    },
  ];

  return defs.map((d) => ({
    id: randomUUID(),
    tenantId: DEMO_TENANT,
    name: d.name,
    description: d.description,
    defaultKm: d.defaultKm,
    defaultDays: d.defaultDays,
    intervalType:
      d.defaultKm && d.defaultDays ? "AMBOS" : d.defaultKm ? "KM" : "DIAS",
    isSystem: true,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  }));
}

function dayAt(offsetDays: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function createInitialStore(): DemoStore {
  const ts = now();
  const maintenanceTypes = seedMaintenanceTypes();

  const client1: ClientRecord = {
    id: "demo-client-1",
    tenantId: DEMO_TENANT,
    name: "João da Silva",
    document: "52998224725",
    whatsapp: "11999887766",
    email: "joao.silva@email.com",
    birthDate: "1985-03-15",
    gender: "MASCULINO",
    addressStreet: "Rua das Palmeiras",
    addressNumber: "120",
    addressComplement: "Apto 42",
    addressDistrict: "Centro",
    addressCity: "São Paulo",
    addressState: "SP",
    addressZip: "01001000",
    notes: "Cliente Michelin frequente",
    status: "ATIVO",
    createdAt: ts,
    updatedAt: ts,
  };

  const client2: ClientRecord = {
    id: "demo-client-2",
    tenantId: DEMO_TENANT,
    name: "Maria Souza",
    document: "39053344705",
    whatsapp: "21988776655",
    email: "maria.souza@email.com",
    birthDate: "1990-07-22",
    gender: "FEMININO",
    addressStreet: "Av. Brasil",
    addressNumber: "500",
    addressComplement: null,
    addressDistrict: "Copacabana",
    addressCity: "Rio de Janeiro",
    addressState: "RJ",
    addressZip: "22041080",
    notes: null,
    status: "ATIVO",
    createdAt: ts,
    updatedAt: ts,
  };

  const vehicle1: VehicleRecord = {
    id: "demo-vehicle-1",
    tenantId: DEMO_TENANT,
    clientId: client1.id,
    plate: "ABC1D23",
    brand: "Hyundai",
    model: "HB20",
    yearManufacture: 2021,
    yearModel: 2022,
    color: "Prata",
    currentKm: 42500,
    chassis: null,
    fuel: "FLEX",
    transmission: "AUTOMATICO",
    engine: "1.0 Turbo",
    power: "120 cv",
    engineCode: null,
    notes: null,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  };

  const vehicle2: VehicleRecord = {
    id: "demo-vehicle-2",
    tenantId: DEMO_TENANT,
    clientId: client2.id,
    plate: "XYZ9876",
    brand: "Toyota",
    model: "Corolla",
    yearManufacture: 2019,
    yearModel: 2020,
    color: "Branco",
    currentKm: 68000,
    chassis: null,
    fuel: "FLEX",
    transmission: "CVT",
    engine: "2.0",
    power: "177 cv",
    engineCode: null,
    notes: null,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  };

  const oilType = maintenanceTypes.find((t) =>
    t.name.includes("Óleo do Motor")
  )!;
  const alignType = maintenanceTypes.find((t) =>
    t.name.includes("Alinhamento")
  )!;

  const users: UserRecord[] = [
    {
      id: "demo-user-admin",
      tenantId: DEMO_TENANT,
      authUserId: "demo-auth",
      email: "admin@robertopneus.demo",
      name: "Admin Demo",
      phone: "11999990000",
      role: "ADMIN",
      specialty: null,
      avatarUrl: null,
      isActive: true,
      tempPassword: null,
      lastLoginAt: ts,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-user-mech",
      tenantId: DEMO_TENANT,
      authUserId: "demo-auth-mech",
      email: "mecanico@robertopneus.demo",
      name: "Carlos Mecânico",
      phone: "11988887777",
      role: "MECANICO",
      specialty: "Suspensão e freios",
      avatarUrl: null,
      isActive: true,
      tempPassword: "Temp@1234",
      lastLoginAt: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-user-rec",
      tenantId: DEMO_TENANT,
      authUserId: "demo-auth-rec",
      email: "recepcao@robertopneus.demo",
      name: "Ana Recepção",
      phone: "11977776666",
      role: "RECEPCIONISTA",
      specialty: null,
      avatarUrl: null,
      isActive: true,
      tempPassword: "Temp@1234",
      lastLoginAt: null,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const mechId = "demo-user-mech";

  const appointments: AppointmentRecord[] = [
    {
      id: "demo-appt-1",
      tenantId: DEMO_TENANT,
      clientId: client1.id,
      vehicleId: vehicle1.id,
      mechanicId: mechId,
      title: "Alinhamento e balanceamento",
      description: "Cliente relatou vibração no volante",
      startsAt: dayAt(0, 9, 0),
      endsAt: dayAt(0, 10, 30),
      status: "CONFIRMADO",
      createdByAi: false,
      publicToken: "pub-appt-demo-1",
      notes: null,
      serviceOrderId: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-appt-2",
      tenantId: DEMO_TENANT,
      clientId: client2.id,
      vehicleId: vehicle2.id,
      mechanicId: mechId,
      title: "Troca de pneus",
      description: "Solicitado via WhatsApp (IA)",
      startsAt: dayAt(1, 14, 0),
      endsAt: dayAt(1, 15, 30),
      status: "AGUARDANDO_APROVACAO",
      createdByAi: true,
      publicToken: null,
      notes: "Agente IA criou este agendamento",
      serviceOrderId: null,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "demo-appt-3",
      tenantId: DEMO_TENANT,
      clientId: client1.id,
      vehicleId: vehicle1.id,
      mechanicId: mechId,
      title: "Revisão de freios",
      description: null,
      startsAt: dayAt(2, 11, 0),
      endsAt: dayAt(2, 12, 0),
      status: "CONFIRMADO",
      createdByAi: false,
      publicToken: "pub-appt-demo-3",
      notes: null,
      serviceOrderId: null,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const os1Id = "demo-os-1";
  const os2Id = "demo-os-2";

  const serviceOrders: ServiceOrderRecord[] = [
    {
      id: os1Id,
      tenantId: DEMO_TENANT,
      number: 1042,
      clientId: client1.id,
      vehicleId: vehicle1.id,
      mechanicId: mechId,
      createdById: "demo-user-admin",
      status: "EM_EXECUCAO",
      kmAtEntry: 42000,
      kmAtExit: null,
      complaint: "Barulho ao frear e vibração",
      diagnosis: "Pastilhas gastas e discos sulcados",
      internalNotes: "Priorizar até 16h",
      discount: 0,
      partsTotal: 380,
      laborTotal: 150,
      grandTotal: 530,
      publicToken: "pub-os-demo-1042",
      estimatedReady: dayAt(0, 17, 0),
      approvedAt: dayAt(-1, 10, 0),
      startedAt: dayAt(0, 8, 30),
      finishedAt: null,
      deliveredAt: null,
      createdAt: dayAt(-1, 9, 0),
      updatedAt: ts,
    },
    {
      id: os2Id,
      tenantId: DEMO_TENANT,
      number: 1043,
      clientId: client2.id,
      vehicleId: vehicle2.id,
      mechanicId: mechId,
      createdById: "demo-user-rec",
      status: "ORCAMENTO",
      kmAtEntry: 67500,
      kmAtExit: null,
      complaint: "Troca de 4 pneus + alinhamento",
      diagnosis: null,
      internalNotes: null,
      discount: 50,
      partsTotal: 1600,
      laborTotal: 200,
      grandTotal: 1750,
      publicToken: "pub-os-demo-1043",
      estimatedReady: null,
      approvedAt: null,
      startedAt: null,
      finishedAt: null,
      deliveredAt: null,
      createdAt: dayAt(0, 8, 0),
      updatedAt: ts,
    },
  ];

  const serviceOrderParts: ServiceOrderPartRecord[] = [
    {
      id: randomUUID(),
      serviceOrderId: os1Id,
      description: "Pastilha de freio dianteira",
      brand: "Bosch",
      quantity: 1,
      unitPrice: 220,
      totalPrice: 220,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: randomUUID(),
      serviceOrderId: os1Id,
      description: "Disco de freio dianteiro (par)",
      brand: "Fremax",
      quantity: 1,
      unitPrice: 160,
      totalPrice: 160,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: randomUUID(),
      serviceOrderId: os2Id,
      description: "Pneu 205/55R16 Michelin Primacy",
      brand: "Michelin",
      quantity: 4,
      unitPrice: 400,
      totalPrice: 1600,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const serviceOrderLabor: ServiceOrderLaborRecord[] = [
    {
      id: randomUUID(),
      serviceOrderId: os1Id,
      description: "Troca de pastilhas e discos",
      hours: 1.5,
      hourlyRate: 100,
      totalPrice: 150,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: randomUUID(),
      serviceOrderId: os2Id,
      description: "Montagem + alinhamento e balanceamento",
      hours: 2,
      hourlyRate: 100,
      totalPrice: 200,
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  const serviceOrderHistory: ServiceOrderStatusHistoryRecord[] = [
    {
      id: randomUUID(),
      serviceOrderId: os1Id,
      fromStatus: null,
      toStatus: "ORCAMENTO",
      changedById: "demo-user-admin",
      changedByName: "Admin Demo",
      notes: "OS aberta",
      createdAt: dayAt(-1, 9, 0),
    },
    {
      id: randomUUID(),
      serviceOrderId: os1Id,
      fromStatus: "ORCAMENTO",
      toStatus: "APROVADO",
      changedById: "demo-user-admin",
      changedByName: "Admin Demo",
      notes: "Cliente aprovou por WhatsApp",
      createdAt: dayAt(-1, 10, 0),
    },
    {
      id: randomUUID(),
      serviceOrderId: os1Id,
      fromStatus: "APROVADO",
      toStatus: "EM_EXECUCAO",
      changedById: mechId,
      changedByName: "Carlos Mecânico",
      notes: null,
      createdAt: dayAt(0, 8, 30),
    },
    {
      id: randomUUID(),
      serviceOrderId: os2Id,
      fromStatus: null,
      toStatus: "ORCAMENTO",
      changedById: "demo-user-rec",
      changedByName: "Ana Recepção",
      notes: "Aguardando aprovação do cliente",
      createdAt: dayAt(0, 8, 0),
    },
  ];

  const whatsappTemplates: WhatsAppTemplateRecord[] =
    DEFAULT_WHATSAPP_TEMPLATES.map((t) => ({
      id: randomUUID(),
      tenantId: DEMO_TENANT,
      key: t.key,
      name: t.name,
      body: t.body,
      isActive: true,
      description: t.description,
      updatedAt: ts,
    }));

  const chatConv1: ChatConversationRecord = {
    id: "demo-chat-1",
    tenantId: DEMO_TENANT,
    serviceOrderId: os1Id,
    clientId: client1.id,
    isActive: true,
    createdAt: dayAt(-1, 10, 0),
    updatedAt: dayAt(0, 9, 15),
  };

  const chatMessages: ChatMessageRecord[] = [
    {
      id: randomUUID(),
      conversationId: chatConv1.id,
      senderUserId: null,
      senderName: client1.name,
      isFromClient: true,
      content: "Bom dia! Quanto tempo falta para o freio ficar pronto?",
      imageUrl: null,
      channel: "APP_CHAT",
      readAt: dayAt(0, 8, 45),
      createdAt: dayAt(0, 8, 40),
    },
    {
      id: randomUUID(),
      conversationId: chatConv1.id,
      senderUserId: mechId,
      senderName: "Carlos Mecânico",
      isFromClient: false,
      content:
        "Bom dia, João! Estamos finalizando a montagem. Previsão até as 16h.",
      imageUrl: null,
      channel: "APP_CHAT",
      readAt: dayAt(0, 9, 0),
      createdAt: dayAt(0, 8, 50),
    },
    {
      id: randomUUID(),
      conversationId: chatConv1.id,
      senderUserId: null,
      senderName: client1.name,
      isFromClient: true,
      content: "Perfeito, obrigado!",
      imageUrl: null,
      channel: "APP_CHAT",
      readAt: null,
      createdAt: dayAt(0, 9, 15),
    },
  ];

  return {
    clients: [client1, client2],
    vehicles: [vehicle1, vehicle2],
    vehicleDocuments: [],
    maintenanceTypes,
    maintenancePlans: [
      {
        id: randomUUID(),
        tenantId: DEMO_TENANT,
        vehicleId: vehicle1.id,
        maintenanceTypeId: oilType.id,
        lastServiceAt: "2025-12-10T00:00:00.000Z",
        lastServiceKm: 38000,
        nextDueAt: "2026-06-10T00:00:00.000Z",
        nextDueKm: 48000,
        intervalKm: 10000,
        intervalDays: 180,
        notes: null,
        isActive: true,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: randomUUID(),
        tenantId: DEMO_TENANT,
        vehicleId: vehicle1.id,
        maintenanceTypeId: alignType.id,
        lastServiceAt: "2026-01-20T00:00:00.000Z",
        lastServiceKm: 40000,
        nextDueAt: "2026-07-20T00:00:00.000Z",
        nextDueKm: 50000,
        intervalKm: 10000,
        intervalDays: 180,
        notes: null,
        isActive: true,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: randomUUID(),
        tenantId: DEMO_TENANT,
        vehicleId: vehicle2.id,
        maintenanceTypeId: oilType.id,
        lastServiceAt: "2025-10-01T00:00:00.000Z",
        lastServiceKm: 60000,
        nextDueAt: "2026-04-01T00:00:00.000Z",
        nextDueKm: 70000,
        intervalKm: 10000,
        intervalDays: 180,
        notes: null,
        isActive: true,
        createdAt: ts,
        updatedAt: ts,
      },
    ],
    users,
    appointments,
    serviceOrders,
    serviceOrderParts,
    serviceOrderLabor,
    serviceOrderPhotos: [],
    serviceOrderHistory,
    whatsappTemplates,
    whatsappLogs: [],
    chatConversations: [chatConv1],
    chatMessages,
    chatTyping: [],
    notifications: [
      {
        id: randomUUID(),
        tenantId: DEMO_TENANT,
        userId: null,
        title: "Nova mensagem no chat",
        body: "João da Silva respondeu na OS #1042",
        href: "/chat?c=demo-chat-1",
        read: false,
        createdAt: dayAt(0, 9, 15),
      },
    ],
    tires: seedDemoTires(),
    tireInterests: [],
    aiConversations: [],
    aiMessages: [],
    nextOsNumber: 1044,
  };
}

export function getDemoStore(): DemoStore {
  if (!globalForDemo.__rpDemoStore) {
    globalForDemo.__rpDemoStore = createInitialStore();
  }
  const store = globalForDemo.__rpDemoStore;
  // Hot-reload safety for newer collections
  if (!store.appointments || !store.chatConversations) {
    globalForDemo.__rpDemoStore = createInitialStore();
    return globalForDemo.__rpDemoStore;
  }
  if (!store.whatsappLogs) store.whatsappLogs = [];
  if (!store.chatMessages) store.chatMessages = [];
  if (!store.chatTyping) store.chatTyping = [];
  if (!store.notifications) store.notifications = [];
  if (!store.tires) store.tires = seedDemoTires();
  if (!store.tireInterests) store.tireInterests = [];
  if (!store.aiConversations) store.aiConversations = [];
  if (!store.aiMessages) store.aiMessages = [];
  return store;
}

export function resetDemoStore() {
  globalForDemo.__rpDemoStore = createInitialStore();
}

export function newId(): string {
  return randomUUID();
}

export const DEMO_TENANT_ID = DEMO_TENANT;
