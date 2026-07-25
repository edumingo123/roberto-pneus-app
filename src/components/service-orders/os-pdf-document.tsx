import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ServiceOrderDetail } from "@/lib/data/types";
import { osStatusLabel } from "@/lib/service-orders/status";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#111",
    paddingBottom: 12,
    marginBottom: 16,
  },
  brand: { fontSize: 16, fontWeight: "bold" },
  muted: { color: "#444", fontSize: 9 },
  osNumber: { fontSize: 14, fontWeight: "bold", textAlign: "right" },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 3,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  col: { flex: 1 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  cellDesc: { flex: 3 },
  cellQty: { flex: 1, textAlign: "right" },
  cellPrice: { flex: 1.2, textAlign: "right" },
  cellTotal: { flex: 1.2, textAlign: "right" },
  totals: { marginTop: 12, alignItems: "flex-end" },
  totalLine: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: 200,
    marginBottom: 3,
  },
  totalLabel: { width: 100, textAlign: "right", marginRight: 12 },
  totalValue: { width: 80, textAlign: "right" },
  grand: { fontSize: 12, fontWeight: "bold", marginTop: 4 },
  signature: {
    marginTop: 48,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: "#111",
    paddingTop: 6,
    textAlign: "center",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
});

function money(n: number) {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function OsPdfDocument({
  order,
  workshopName,
}: {
  order: ServiceOrderDetail;
  workshopName: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{workshopName}</Text>
            <Text style={styles.muted}>Centro Automotivo · Ordem de Serviço</Text>
          </View>
          <View>
            <Text style={styles.osNumber}>OS #{order.number}</Text>
            <Text style={styles.muted}>{osStatusLabel(order.status)}</Text>
            <Text style={styles.muted}>
              {new Date(order.createdAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente e veículo</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text>Cliente: {order.client.name}</Text>
              <Text>Documento: {order.client.document}</Text>
              <Text>WhatsApp: {order.client.whatsapp}</Text>
            </View>
            <View style={styles.col}>
              <Text>
                Veículo: {order.vehicle.brand} {order.vehicle.model}
              </Text>
              <Text>Placa: {order.vehicle.plate}</Text>
              <Text>
                Cor: {order.vehicle.color} · Ano: {order.vehicle.yearModel}
              </Text>
              <Text>
                KM entrada: {order.kmAtEntry}
                {order.kmAtExit != null ? ` · KM saída: ${order.kmAtExit}` : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          <Text>Problema: {order.complaint || "—"}</Text>
          <Text>Diagnóstico: {order.diagnosis || "—"}</Text>
          {order.mechanic ? (
            <Text>Mecânico: {order.mechanic.name}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peças</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.cellDesc}>Descrição</Text>
            <Text style={styles.cellQty}>Qtd</Text>
            <Text style={styles.cellPrice}>Unit.</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>
          {order.parts.length === 0 ? (
            <Text style={styles.muted}>Nenhuma peça</Text>
          ) : (
            order.parts.map((p) => (
              <View key={p.id} style={styles.tableRow}>
                <Text style={styles.cellDesc}>
                  {p.description}
                  {p.brand ? ` (${p.brand})` : ""}
                </Text>
                <Text style={styles.cellQty}>{p.quantity}</Text>
                <Text style={styles.cellPrice}>{money(p.unitPrice)}</Text>
                <Text style={styles.cellTotal}>{money(p.totalPrice)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mão de obra</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.cellDesc}>Descrição</Text>
            <Text style={styles.cellQty}>Horas</Text>
            <Text style={styles.cellPrice}>R$/h</Text>
            <Text style={styles.cellTotal}>Total</Text>
          </View>
          {order.laborItems.length === 0 ? (
            <Text style={styles.muted}>Nenhum item</Text>
          ) : (
            order.laborItems.map((l) => (
              <View key={l.id} style={styles.tableRow}>
                <Text style={styles.cellDesc}>{l.description}</Text>
                <Text style={styles.cellQty}>{l.hours}</Text>
                <Text style={styles.cellPrice}>{money(l.hourlyRate)}</Text>
                <Text style={styles.cellTotal}>{money(l.totalPrice)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Peças</Text>
            <Text style={styles.totalValue}>R$ {money(order.partsTotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Mão de obra</Text>
            <Text style={styles.totalValue}>R$ {money(order.laborTotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Desconto</Text>
            <Text style={styles.totalValue}>R$ {money(order.discount)}</Text>
          </View>
          <View style={[styles.totalLine, styles.grand]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>R$ {money(order.grandTotal)}</Text>
          </View>
        </View>

        <View style={styles.signature}>
          <Text style={styles.signBox}>Assinatura do cliente</Text>
          <Text style={styles.signBox}>Assinatura da oficina</Text>
        </View>

        <Text style={styles.footer}>
          Documento gerado por Roberto Pneus App · {workshopName}
        </Text>
      </Page>
    </Document>
  );
}
