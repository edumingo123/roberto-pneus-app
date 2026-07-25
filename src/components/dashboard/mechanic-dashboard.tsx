import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  Play,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPlate } from "@/lib/format";
import { osStatusLabel } from "@/lib/service-orders/status";
import type { ServiceOrderListItem } from "@/lib/data/types";

const actionLinkClass =
  "inline-flex items-center justify-center h-12 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] tap-target min-h-12";

export function MechanicDashboard({
  userName,
  orders,
}: {
  userName: string;
  orders: ServiceOrderListItem[];
}) {
  const mine = orders.filter(
    (o) =>
      o.status !== "ENTREGUE" &&
      o.status !== "CANCELADO"
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Olá, {userName.split(" ")[0]}
        </h2>
        <p className="text-sm text-muted-foreground">
          Suas ordens de serviço — toque nos botões grandes
        </p>
      </div>

      {mine.length === 0 ? (
        <Card className="rounded-xl border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma OS atribuída no momento.
            <div className="mt-4">
              <Link
                href="/ordens-servico"
                className={cn(
                  actionLinkClass,
                  "bg-primary text-primary-foreground px-6"
                )}
              >
                Ver todas as OS
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mine.map((os) => (
            <Card
              key={os.id}
              className="rounded-xl border-border shadow-sm overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg">
                          OS #{os.number}
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-lg text-[10px]"
                        >
                          {osStatusLabel(os.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {os.vehicleLabel} · {formatPlate(os.vehiclePlate)}
                      </p>
                      <p className="text-sm font-medium">{os.clientName}</p>
                    </div>
                    <Wrench className="h-5 w-5 text-brand-orange shrink-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {os.status === "APROVADO" ? (
                      <Link
                        href={`/ordens-servico/${os.id}`}
                        className={cn(
                          actionLinkClass,
                          "bg-brand-orange hover:bg-brand-orange/90 text-white col-span-2"
                        )}
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Iniciar serviço
                      </Link>
                    ) : null}
                    {os.status === "EM_EXECUCAO" ? (
                      <>
                        <Link
                          href={`/ordens-servico/${os.id}`}
                          className={cn(
                            actionLinkClass,
                            "bg-primary hover:bg-primary/90 text-primary-foreground"
                          )}
                        >
                          Continuar
                        </Link>
                        <Link
                          href={`/ordens-servico/${os.id}`}
                          className={cn(
                            actionLinkClass,
                            "border border-success text-success hover:bg-success/10"
                          )}
                        >
                          <ClipboardCheck className="h-5 w-5 mr-1" />
                          Finalizar
                        </Link>
                      </>
                    ) : null}
                    {os.status === "QUALITY_CHECK" ? (
                      <Link
                        href={`/ordens-servico/${os.id}`}
                        className={cn(
                          actionLinkClass,
                          "bg-success hover:bg-success/90 text-white col-span-2"
                        )}
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Aprovar qualidade
                      </Link>
                    ) : null}
                    {os.status === "ORCAMENTO" ||
                    os.status === "PRONTO_RETIRADA" ? (
                      <Link
                        href={`/ordens-servico/${os.id}`}
                        className={cn(
                          actionLinkClass,
                          "bg-primary text-primary-foreground col-span-2"
                        )}
                      >
                        Abrir OS
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="rounded-xl border-dashed border-2 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dica</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use os botões grandes com uma mão. Sempre atualize a KM ao criar ou
          finalizar uma OS. Fotos precisam de legenda (antes/depois).
        </CardContent>
      </Card>
    </div>
  );
}
