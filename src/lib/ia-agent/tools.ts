import {
  checkCompatibility,
  searchTiresForAgent,
} from "@/lib/data/tires";
import { getDemoStore, newId } from "@/lib/data/demo-store";
import { createAppointment } from "@/lib/data/appointments";
import { effectivePrice } from "@/lib/data/tires";
import type { TireRecord } from "@/lib/data/types";

export const AGENT_TOOLS_OPENAI = [
  {
    type: "function" as const,
    function: {
      name: "buscar_pneus",
      description:
        "Consulta o catálogo de pneus por medida, marca, modelo de carro ou preço máximo",
      parameters: {
        type: "object",
        properties: {
          medida: {
            type: "string",
            description: "Medida do pneu, ex: 205/55R16",
          },
          marca: { type: "string", description: "Marca, ex: Michelin" },
          modelo_carro: {
            type: "string",
            description: "Modelo do carro, ex: Honda Civic 2020",
          },
          preco_max: {
            type: "number",
            description: "Preço máximo unitário em BRL",
          },
          tipo: {
            type: "string",
            description: "PASSEIO, SUV, CAMINHONETE, COMERCIAL, MOTO, OFF_ROAD",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "verificar_compatibilidade",
      description: "Verifica se um pneu é compatível com um veículo",
      parameters: {
        type: "object",
        properties: {
          tire_id: { type: "string", description: "ID do pneu no catálogo" },
          veiculo: {
            type: "string",
            description: "Descrição do veículo, ex: Honda Civic 2020",
          },
        },
        required: ["tire_id", "veiculo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "consultar_estoque",
      description: "Retorna quantidade em estoque de um pneu",
      parameters: {
        type: "object",
        properties: {
          tire_id: { type: "string" },
          medida: { type: "string" },
          marca: { type: "string" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "criar_agendamento",
      description:
        "Cria agendamento com status Aguardando Aprovação (será confirmado pela oficina)",
      parameters: {
        type: "object",
        properties: {
          nome_cliente: { type: "string" },
          telefone: { type: "string" },
          placa: { type: "string" },
          servico: { type: "string" },
          data: {
            type: "string",
            description: "Data YYYY-MM-DD",
          },
          horario: {
            type: "string",
            description: "Horário HH:mm",
          },
          observacoes: { type: "string" },
        },
        required: ["nome_cliente", "servico", "data", "horario"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "consultar_status_os",
      description: "Consulta status de ordem de serviço por placa ou número",
      parameters: {
        type: "object",
        properties: {
          placa: { type: "string" },
          numero_os: { type: "number" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "informacoes_oficina",
      description:
        "Retorna horário de funcionamento, endereço e formas de pagamento",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

function summarizeTire(t: TireRecord) {
  return {
    id: t.id,
    marca: t.brand,
    modelo: t.model,
    medida: t.size,
    tipo: t.type,
    preco: effectivePrice(t),
    preco_lista: t.price,
    promocao: t.isPromo,
    estoque: t.stockQty,
    compativel_com: t.compatibleModels.slice(0, 8),
  };
}

export async function executeAgentTool(
  tenantId: string,
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "buscar_pneus": {
      const tires = await searchTiresForAgent(tenantId, {
        medida: args.medida as string | undefined,
        marca: args.marca as string | undefined,
        modelo_carro: args.modelo_carro as string | undefined,
        preco_max: args.preco_max as number | undefined,
        tipo: args.tipo as string | undefined,
      });
      return {
        total: tires.length,
        pneus: tires.slice(0, 8).map(summarizeTire),
      };
    }
    case "verificar_compatibilidade": {
      return checkCompatibility(
        tenantId,
        String(args.tire_id),
        String(args.veiculo)
      );
    }
    case "consultar_estoque": {
      const store = getDemoStore();
      let tires = store.tires.filter(
        (t) => t.tenantId === tenantId && t.isActive
      );
      if (args.tire_id) {
        tires = tires.filter((t) => t.id === args.tire_id);
      } else {
        if (args.medida) {
          const m = String(args.medida).toUpperCase().replace(/\s+/g, "");
          tires = tires.filter((t) =>
            t.size.toUpperCase().replace(/\s+/g, "").includes(m)
          );
        }
        if (args.marca) {
          const b = String(args.marca).toLowerCase();
          tires = tires.filter((t) => t.brand.toLowerCase().includes(b));
        }
      }
      return tires.slice(0, 10).map((t) => ({
        id: t.id,
        marca: t.brand,
        modelo: t.model,
        medida: t.size,
        estoque: t.stockQty,
        disponivel: t.stockQty > 0,
      }));
    }
    case "criar_agendamento": {
      const store = getDemoStore();
      const nome = String(args.nome_cliente || "Cliente WhatsApp");
      const telefone = args.telefone
        ? String(args.telefone).replace(/\D/g, "")
        : null;

      // Find or create lightweight client
      let client = store.clients.find(
        (c) =>
          c.tenantId === tenantId &&
          ((telefone && c.whatsapp.includes(telefone)) ||
            c.name.toLowerCase() === nome.toLowerCase())
      );
      if (!client) {
        const ts = new Date().toISOString();
        client = {
          id: newId(),
          tenantId,
          name: nome,
          document: "00000000000",
          whatsapp: telefone || "11999999999",
          email: null,
          birthDate: null,
          gender: "NAO_INFORMADO",
          addressStreet: "A definir",
          addressNumber: "S/N",
          addressComplement: null,
          addressDistrict: "A definir",
          addressCity: "A definir",
          addressState: "SP",
          addressZip: "00000000",
          notes: "Cadastrado via Agente IA WhatsApp",
          status: "ATIVO",
          createdAt: ts,
          updatedAt: ts,
        };
        store.clients.unshift(client);
      }

      let vehicleId: string | null = null;
      if (args.placa) {
        const plate = String(args.placa)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        const v = store.vehicles.find(
          (x) => x.tenantId === tenantId && x.plate === plate
        );
        if (v) vehicleId = v.id;
      }

      const data = String(args.data);
      const horario = String(args.horario);
      const startsAt = new Date(`${data}T${horario}:00`);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      const appt = await createAppointment(tenantId, {
        clientId: client.id,
        vehicleId,
        title: String(args.servico || "Atendimento"),
        description: args.observacoes
          ? String(args.observacoes)
          : "Criado pelo agente de IA (WhatsApp)",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        notes: "Aguardando aprovação da oficina",
        createdByAi: true,
        status: "AGUARDANDO_APROVACAO",
      });

      store.notifications.unshift({
        id: newId(),
        tenantId,
        userId: null,
        title: "Agendamento via IA",
        body: `${nome} — ${args.servico} em ${data} ${horario}`,
        href: "/agendamentos",
        read: false,
        createdAt: new Date().toISOString(),
      });

      return {
        sucesso: true,
        agendamento_id: appt.id,
        status: appt.status,
        mensagem:
          "Agendamento criado como Aguardando Aprovação. A oficina confirmará em breve.",
      };
    }
    case "consultar_status_os": {
      const store = getDemoStore();
      let orders = store.serviceOrders.filter((o) => o.tenantId === tenantId);
      if (args.numero_os != null) {
        orders = orders.filter((o) => o.number === Number(args.numero_os));
      } else if (args.placa) {
        const plate = String(args.placa)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        const vehicleIds = store.vehicles
          .filter((v) => v.tenantId === tenantId && v.plate.includes(plate))
          .map((v) => v.id);
        orders = orders.filter((o) => vehicleIds.includes(o.vehicleId));
      } else {
        return { erro: "Informe placa ou número da OS" };
      }

      return orders.slice(0, 5).map((o) => {
        const v = store.vehicles.find((x) => x.id === o.vehicleId);
        const c = store.clients.find((x) => x.id === o.clientId);
        return {
          numero: o.number,
          status: o.status,
          placa: v?.plate,
          cliente: c?.name,
          total: o.grandTotal,
          token_publico: o.publicToken,
        };
      });
    }
    case "informacoes_oficina": {
      return {
        nome: "Roberto Pneus",
        descricao: "Centro automotivo · Autorizada Michelin",
        horario: {
          segunda_sexta: "08:00–18:00",
          sabado: "08:00–12:00",
          domingo: "Fechado",
        },
        endereco: "Consulte a unidade no app (multi-tenant)",
        formas_pagamento: ["PIX", "Cartão de crédito", "Cartão de débito", "Dinheiro"],
        telefone: "(11) 99999-0000",
        servicos: [
          "Pneus Michelin e outras marcas",
          "Alinhamento e balanceamento",
          "Mecânica leve e pesada",
          "Troca de óleo e filtros",
        ],
      };
    }
    default:
      return { erro: `Ferramenta desconhecida: ${name}` };
  }
}
