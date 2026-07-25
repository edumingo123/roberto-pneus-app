/**
 * Seed inicial — tenant Roberto Pneus + tipos de manutenção padrão.
 * Uso: npx tsx prisma/seed.ts
 * Requer DATABASE_URL válido e prisma generate.
 */
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_MAINTENANCE_TYPES = [
  {
    name: "Troca de Óleo do Motor",
    defaultKm: 10000,
    defaultDays: 180,
    isSystem: true,
  },
  {
    name: "Troca de Óleo do Câmbio",
    defaultKm: 40000,
    defaultDays: 730,
    isSystem: true,
  },
  {
    name: "Correia Dentada",
    defaultKm: 60000,
    defaultDays: 1460,
    isSystem: true,
  },
  {
    name: "Fluido de Freio",
    defaultKm: 30000,
    defaultDays: 730,
    isSystem: true,
  },
  {
    name: "Líquido de Arrefecimento",
    defaultKm: 40000,
    defaultDays: 730,
    isSystem: true,
  },
  {
    name: "Alinhamento e Balanceamento",
    defaultKm: 10000,
    defaultDays: 180,
    isSystem: true,
  },
  { name: "Suspensão", defaultKm: 40000, defaultDays: 730, isSystem: true },
  { name: "Filtro de Ar", defaultKm: 15000, defaultDays: 365, isSystem: true },
  {
    name: "Filtro de Combustível",
    defaultKm: 20000,
    defaultDays: 365,
    isSystem: true,
  },
  {
    name: "Velas de Ignição",
    defaultKm: 30000,
    defaultDays: 730,
    isSystem: true,
  },
  {
    name: "Pneus / Rodízio",
    defaultKm: 10000,
    defaultDays: 180,
    isSystem: true,
  },
];

const DEFAULT_WHATSAPP_TEMPLATES = [
  {
    key: "os_status_change",
    name: "Mudança de status da OS",
    body: "Olá {{cliente_nome}}! A OS #{{os_numero}} do veículo {{placa}} está agora: *{{status}}*. Acompanhe: {{link_publico}}",
  },
  {
    key: "appointment_reminder",
    name: "Lembrete de agendamento",
    body: "Olá {{cliente_nome}}! Lembrete: você tem agendamento em {{data_hora}} na {{oficina_nome}}. Placa: {{placa}}.",
  },
  {
    key: "appointment_confirmation",
    name: "Confirmação de agendamento",
    body: "Agendamento confirmado! {{data_hora}} — {{oficina_nome}}. Acompanhe: {{link_publico}}",
  },
  {
    key: "maintenance_reminder",
    name: "Lembrete de manutenção",
    body: "Olá {{cliente_nome}}! O veículo {{placa}} está próximo da manutenção *{{tipo_manutencao}}* ({{proximo_km_ou_data}}). Agende conosco!",
  },
  {
    key: "os_ready",
    name: "Veículo pronto para retirada",
    body: "Olá {{cliente_nome}}! Seu veículo {{placa}} está *pronto para retirada* na {{oficina_nome}}. OS #{{os_numero}}.",
  },
];

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "roberto-pneus" },
    update: {},
    create: {
      name: "Roberto Pneus",
      slug: "roberto-pneus",
      cnpj: null,
      phone: null,
      whatsapp: null,
      addressCity: "Brasil",
      paymentMethods: ["PIX", "Cartão", "Dinheiro"],
      businessHours: {
        mon: "08:00-18:00",
        tue: "08:00-18:00",
        wed: "08:00-18:00",
        thu: "08:00-18:00",
        fri: "08:00-18:00",
        sat: "08:00-12:00",
        sun: "Fechado",
      },
      settings: {
        create: {
          reminderDaysBefore: 7,
          reminderKmBefore: 500,
        },
      },
    },
  });

  console.log("Tenant:", tenant.name, tenant.id);

  for (const t of DEFAULT_MAINTENANCE_TYPES) {
    await prisma.maintenanceType.upsert({
      where: {
        tenantId_name: { tenantId: tenant.id, name: t.name },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: t.name,
        defaultKm: t.defaultKm,
        defaultDays: t.defaultDays,
        isSystem: t.isSystem,
        intervalType: "AMBOS",
      },
    });
  }

  for (const tpl of DEFAULT_WHATSAPP_TEMPLATES) {
    await prisma.whatsAppTemplate.upsert({
      where: {
        tenantId_key: { tenantId: tenant.id, key: tpl.key },
      },
      update: { body: tpl.body, name: tpl.name },
      create: {
        tenantId: tenant.id,
        key: tpl.key,
        name: tpl.name,
        body: tpl.body,
      },
    });
  }

  // Demo staff user (link authUserId after creating Supabase user)
  const adminEmail = "admin@robertopneus.local";
  await prisma.user.upsert({
    where: { authUserId: "seed-admin-pending-supabase" },
    update: {},
    create: {
      tenantId: tenant.id,
      authUserId: "seed-admin-pending-supabase",
      email: adminEmail,
      name: "Administrador",
      role: Role.ADMIN,
    },
  });

  console.log("Seed concluído.");
  console.log(
    "Após criar o usuário no Supabase Auth, atualize users.authUserId com o UUID real."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
