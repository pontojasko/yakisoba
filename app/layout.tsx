import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YakiHami | Sabor que vem da chapa 🔥",
  description: "Faça seu pedido de yakisoba fresquinho diretamente pelo cardápio online.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${quicksand.variable} antialiased`}>
      <body className="min-h-screen bg-background">
        <QueryProvider>
          {children}
        </QueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

