import { Page as PageComponent } from "@/components/Theme/Page";
import { AppLayout } from "@/layouts/AppLayout";
import Head from "next/head";
import { BrowserRouter } from "react-router-dom";

export default function Page() {
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  return (
    <>
      <Head>
        <title>Project S</title>
        <meta name="description" content="Project S" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#081118" />
      </Head>
      {!isSSR ? (
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      ) : (
        <PageComponent />
      )}
    </>
  );
}
