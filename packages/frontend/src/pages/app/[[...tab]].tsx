import { Page as PageComponent } from "@/components/Theme/Page";
import { AppLayout } from "@/layouts/AppLayout";
import { BrowserRouter } from "react-router-dom";

export default function Page() {
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  if (!isSSR) {
    return (
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    );
  } else {
    return <PageComponent />;
  }
}
