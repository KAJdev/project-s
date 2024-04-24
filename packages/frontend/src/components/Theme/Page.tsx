export function Page({ children, className }: StyleableWithChildren) {
  return (
    <main className={classes("flex h-screen min-h-0", className)}>
      {children}
    </main>
  );
}
