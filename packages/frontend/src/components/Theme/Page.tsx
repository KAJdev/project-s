import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export function Page({ children, className }: StyleableWithChildren) {
  return (
    <main
      className={classes("flex h-screen min-h-0", inter.className, className)}
    >
      {children}
    </main>
  );
}
