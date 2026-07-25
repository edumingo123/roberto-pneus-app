import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Roberto Pneus App",
    short_name: "Roberto Pneus",
    description:
      "Gestão de oficina mecânica e centro automotivo — multi-tenant SaaS",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0A2540",
    theme_color: "#0A2540",
    orientation: "portrait-primary",
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
