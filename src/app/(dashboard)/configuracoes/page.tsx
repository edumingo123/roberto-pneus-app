import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText, Settings, Users, Webhook } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Configurações" };

const links = [
  {
    href: "/configuracoes/templates",
    title: "Mensagens automáticas",
    description: "Templates WhatsApp com variáveis e preview",
    icon: MessageSquareText,
  },
  {
    href: "/usuarios",
    title: "Usuários",
    description: "Colaboradores e perfis de acesso",
    icon: Users,
  },
  {
    href: "/configuracoes/whatsapp",
    title: "Integração WhatsApp",
    description: "Evolution API e logs de envio",
    icon: Webhook,
  },
  {
    href: "/tipos-manutencao",
    title: "Tipos de manutenção",
    description: "Intervalos e lembretes",
    icon: Settings,
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Oficina, comunicação e integrações
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
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
          );
        })}
      </div>
    </div>
  );
}
