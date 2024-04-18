import { Outlet, useRoutes } from "react-router-dom";
import { Page as PageComponent } from "@/components/Theme/Page";
import { SidebarLayout } from "@/layouts/SidebarLayout";
import { Account } from "./Account";
import { useGateway } from "@/lib/gateway";
import { ChannelLayout } from "./ChannelLayout";
import { useToken } from "@/lib/token";
import { useRouter } from "next/router";
import { useFetchUser } from "@/lib/users";

function AppElement() {
  const isReady = useGateway();
  useFetchUser();
  return (
    <PageComponent>
      <Outlet />
      <div
        className={classes(
          "w-full h-full absolute z-100 bg-black opacity-100 duration-200 flex items-center justify-center",
          isReady
            ? "opacity-0 pointer-events-none"
            : "opacity-100 pointer-events-auto"
        )}
      >
        Loading...
      </div>
    </PageComponent>
  );
}

export function AppLayout() {
  const token = useToken();
  const router = useRouter();

  let element = useRoutes([
    {
      path: "/app",
      element: <AppElement />,
      children: [
        {
          index: true,
          element: (
            <>
              <SidebarLayout />
              <Outlet />
            </>
          ),
        },
        {
          path: "channels/:channelId",
          element: (
            <>
              <SidebarLayout />
              <ChannelLayout />
            </>
          ),
        },
        {
          path: "preferences",
          element: <h1>Preferences</h1>,
        },
        {
          path: "account",
          element: <Account />,
        },
      ],
    },
  ]);

  if (!token) {
    router.push("/login");
  }

  return element;
}
