"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileDown } from "lucide-react";
import type { ServiceOrderDetail } from "@/lib/data/types";
import { OsPdfDocument } from "./os-pdf-document";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function OsPdfDownload({
  order,
  workshopName,
}: {
  order: ServiceOrderDetail;
  workshopName: string;
}) {
  return (
    <PDFDownloadLink
      document={
        <OsPdfDocument order={order} workshopName={workshopName} />
      }
      fileName={`OS-${order.number}-${order.vehicle.plate}.pdf`}
      className={cn(
        buttonVariants({ variant: "outline" }),
        "h-10 rounded-xl no-underline"
      )}
    >
      {({ loading }) =>
        loading ? (
          "Gerando PDF..."
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-1.5" />
            Gerar PDF / Imprimir
          </>
        )
      }
    </PDFDownloadLink>
  );
}
