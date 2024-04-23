import { Outlet, useLocation, useParams, useRoutes } from "react-router-dom";
import { Page as PageComponent } from "@/components/Theme/Page";
import { SidebarLayout } from "@/layouts/SidebarLayout";
import { Account } from "./Account";
import { useGateway } from "@/lib/gateway";
import { ChannelLayout } from "./ChannelLayout";
import { useToken } from "@/lib/token";
import { useRouter } from "next/router";
import { useFetchUser } from "@/lib/users";
import { GalaxyLayout } from "./GalaxyLayout";
import { GameLayout } from "./GameLayout";
import { Sparkle } from "lucide-react";
import { Galaxy } from "@/components/Icons/Galaxy";
import { NewGameLayout } from "./NewGameLayout";
import { StarBackground } from "@/components/Theme/StarBackground";

function AppElement() {
  const isReady = useGateway();
  const { gameId } = useParams();
  useFetchUser();
  return (
    <PageComponent>
      {!gameId && <StarBackground centerAdapt />}
      <Outlet />
      <div
        className={classes(
          "w-full h-full absolute z-[100] bg-black opacity-100 duration-200 flex items-center justify-center",
          isReady
            ? "opacity-0 pointer-events-none"
            : "opacity-100 pointer-events-auto"
        )}
      >
        <Galaxy
          className="animate-spin w-16 h-16 text-white -scale-100"
          fill="white"
        />
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
          element: <GalaxyLayout />,
        },
        {
          path: "games",
          element: <GalaxyLayout />,
        },
        {
          path: "games/:gameId",
          element: <GameLayout />,
        },
        {
          path: "new",
          element: <NewGameLayout />,
        },
      ],
    },
  ]);

  if (!token) {
    router.push("/login");
  }

  return element;
}
