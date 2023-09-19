import { DocShell } from "@/components/shell";
import "@mantine/code-highlight/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import type { Metadata } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import { TOC } from "./toc";

const zen = Zen_Maru_Gothic({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "extmod",
  description: "Enable dynamic, federated ESM modules for any Node application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body className={zen.className}>
        <MantineProvider
          theme={{
            headings: {
              fontFamily: zen.style.fontFamily,
            },
          }}
        >
          <DocShell
            sidebar={<TOC />}
          >{children}</DocShell>
        </MantineProvider>
      </body>
    </html>
  );
}
