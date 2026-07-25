import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Manutenção" };

export default function ManutencaoPage() {
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Manutenção</h2>
        <p className="text-sm text-muted-foreground">
          Planos por veículo (Fase 3+) e tipos configuráveis
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/tipos-manutencao">
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Tipos de manutenção</p>
                <p className="text-sm text-muted-foreground">
                  CRUD de intervalos em KM e dias
                </p>
              </div>
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-fit rounded-lg"
                )}
              >
                Abrir
              </span>
            </CardContent>
          </Card>
        </Link>

        <Card className="rounded-xl shadow-sm border-dashed h-full opacity-80">
          <CardContent className="p-5 flex flex-col gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Planos por veículo</p>
              <p className="text-sm text-muted-foreground">
                Disponível na Fase 3 junto com as OS
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
