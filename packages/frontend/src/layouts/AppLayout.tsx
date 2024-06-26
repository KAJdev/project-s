import { Outlet, useParams, useRoutes } from "react-router-dom";
import { Page as PageComponent } from "@/components/Theme/Page";
import { useGateway } from "@/lib/gateway";
import { useToken } from "@/lib/token";
import { useRouter } from "next/router";
import { useFetchUser } from "@/lib/users";
import { HomePage } from "./HomePage";
import { GameLayout } from "./GameLayout";
import { Galaxy } from "@/components/Icons/Galaxy";
import { NewGameLayout } from "./NewGameLayout";
import { StarBackground } from "@/components/Theme/StarBackground";
import { useGame } from "@/lib/games";

function AppElement() {
  const isReady = useGateway();
  const { gameId } = useParams();
  const game = useGame(gameId);
  useFetchUser();
  return (
    <PageComponent>
      {!gameId && <StarBackground centerAdapt />}
      <Outlet />
      <div
        className={classes(
          "w-full h-full absolute z-[100] bg-black opacity-100 duration-200 flex items-center justify-center",
          isReady && ((gameId && game) || !gameId)
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
          element: <HomePage />,
        },
        {
          path: "games",
          element: <HomePage />,
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
