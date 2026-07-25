import { Construction } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  phase: string;
  features?: string[];
}

export function ModulePlaceholder({
  title,
  description,
  phase,
  features = [],
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <Badge variant="secondary" className="rounded-lg">
          {phase}
        </Badge>
      </div>

      <Card className="rounded-xl shadow-sm border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Construction className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Em construção</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        {features.length > 0 ? (
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Previsto
            </p>
            <ul className="space-y-1.5 text-sm">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
