import Head from "next/head";

export function HTMLHead({
  title = "Project S",
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <Head>
      <title>
        {title}
        {subtitle ? " - " + subtitle : ""}
      </title>
      <meta name="description" content="Project S" />
      <link rel="icon" href="/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#081118" />
    </Head>
  );
}
