import "@/styles/globals.css";
import "../globals";
import type { AppProps } from "next/app";
import localFont from "next/font/local";

export const font = localFont({
  src: "/nb_architekt_regular-webfont.woff2",
  fallback: ["sans-serif"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={font.className}>
      <Component {...pageProps} />
    </main>
  );
}
