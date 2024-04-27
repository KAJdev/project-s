import { HTMLHead } from "@/components/HTMLHead";
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
      <HTMLHead />
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
