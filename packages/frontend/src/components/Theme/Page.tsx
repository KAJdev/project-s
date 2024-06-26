export function Page({ children, className }: StyleableWithChildren) {
  return (
    <main className={classes("flex h-full min-h-0", className)}>
      {children}
    </main>
  );
}
