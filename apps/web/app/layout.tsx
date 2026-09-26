import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource-variable/source-serif-4/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "JurisVia | Gestão jurídica com clareza",
  description: "Organize casos, prazos, documentos e equipe e planeje uma comunicação mais clara com o cliente.",
  applicationName: "JurisVia",
  robots: { index: true, follow: true },
  openGraph: {
    title: "JurisVia | Gestão jurídica com clareza",
    description: "Uma proposta para organizar a rotina do escritório e deixar cada próximo passo claro.",
    type: "website",
    locale: "pt_BR",
  },
};

const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem("jurisvia-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
