import { Game } from "@/lib/games";
import { Scan, useScan } from "@/lib/scan";
import { KonvaNodeComponent, Layer, Stage, StageProps } from "react-konva";
import { useWindowSize } from "react-use";
import { MapStar } from "./Map/Star";
import { mapState } from "@/lib/map";
import { InnerScanCircle, OuterScanCircle } from "./Map/ScanCircle";
import { UseKeyOptions } from "react-use/lib/useKey";
import { HyperspaceCircle } from "./Map/HyperspaceCircle";
import { MapCarrier } from "./Map/Carrier";
import { CarrierLines } from "./Map/CarrierLines";
import { distance } from "@/lib/utils";

function Stars({ scan }: { scan: Scan | null }) {
  return useMemo(
    () => (
      <>
        <Layer>
          {scan?.stars.map((star) => (
            <HyperspaceCircle
              key={keys(star.id, "hyperscape")}
              scan={scan}
              starId={star.id}
            />
          ))}
        </Layer>
        <Layer>
          {scan?.stars.map((star) => (
            <OuterScanCircle
              key={keys(star.id, "outerscan")}
              scan={scan}
              starId={star.id}
            />
          ))}
          {scan?.stars.map((star) => (
            <InnerScanCircle
              key={keys(star.id, "innerscan")}
              scan={scan}
              starId={star.id}
            />
          ))}
        </Layer>
        <Layer>
          {scan?.carriers.map((carrier) => (
            <CarrierLines key={carrier.id} scan={scan} carrierId={carrier.id} />
          ))}
          {scan?.stars.map((star) => (
            <MapStar key={star.id} scan={scan} starId={star.id} />
          ))}
        </Layer>
      </>
    ),
    [scan]
  );
}

function Carriers({ scan }: { scan: Scan | null }) {
  return useMemo(
    () => (
      <Layer>
        {scan?.carriers.map((carrier) => (
          <MapCarrier key={carrier.id} scan={scan} carrierId={carrier.id} />
        ))}
      </Layer>
    ),
    [scan]
  );
}

function Entities({ gameId }: { gameId: ID }) {
  const scan = useScan(gameId);
  return (
    <>
      <Stars scan={scan} />
      <Carriers scan={scan} />
    </>
  );
}

export function Map({ game }: { game: Game }) {
  const scan = useScan(game.id);
  const parentRef = useRef<HTMLDivElement>(null);
  const { zoom, camera, panning } = mapState();
  const { width, height } = useWindowSize();
  const stage = React.useRef<any>(null);
  const lastPointerDownPosition = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const pr = parentRef.current;
    const handleWheel = (e: WheelEvent) => {
      const ms = mapState.getState();

      const newZoom = clamp(5, zoom - (e.deltaY / 1000) * zoom, 500);
      ms.setZoom(newZoom);

      // // that will zoom towards the center, but we want to zoom towards the mouse position
      const currentStage = stage.current as any; // fuck typescript
      if (!currentStage) return;
      const pointer = currentStage.getPointerPosition() as {
        x: number;
        y: number;
      };

      const mousePointTo = {
        x: (pointer.x - currentStage.x()) / zoom,
        y: (pointer.y - currentStage.y()) / zoom,
      };

      ms.setCamera({
        x: pointer.x - mousePointTo.x * newZoom,
        y: pointer.y - mousePointTo.y * newZoom,
      });
    };

    pr?.addEventListener("wheel", handleWheel);
    return () => pr?.removeEventListener("wheel", handleWheel);
  }, [height, width, zoom]);

  const onMouseUp = useCallback(
    (e: any) => {
      const pointer = e.target.getStage()!.getPointerPosition()!;
      if (
        e.evt.button === 0 &&
        distance(pointer, lastPointerDownPosition.current) < 2 &&
        scan
      ) {
        const transformedPointer = {
          x: (pointer.x - camera.x) / zoom,
          y: (pointer.y - camera.y) / zoom,
        };

        // find all entities within a distance of like 100 pixels and select them
        const entities = [
          ...(scan.stars.map((s) => ({ ...s, type: "star" })) as any),
          ...(scan.carriers.map((c) => ({ ...c, type: "carrier" })) as any),
        ]
          .filter((e) => distance(e.position, transformedPointer) * zoom < 20)
          .sort((a, b) => {
            return (
              distance(a.position, transformedPointer) -
              distance(b.position, transformedPointer)
            );
          });

        mapState.getState().setFlightPlanningFor(null);
        mapState.getState().setSelected(
          entities
            // only grab first of each type
            .filter(
              (e, i, arr) =>
                e.type === "carrier" ||
                arr.findIndex((a) => a.type === e.type) === i
            )
            .map((e) => ({
              type: e.type,
              id: e.id,
            }))
        );
      }
    },
    [camera.x, camera.y, scan, zoom]
  );

  const onMouseMove = useCallback(
    (e: any) => {
      if (mapState.getState().panning) {
        mapState.getState().setCamera({
          x: camera.x + e.evt.movementX,
          y: camera.y + e.evt.movementY,
        });
      }
    },
    [camera.x, camera.y]
  );

  const onMouseDown = useCallback((e: any) => {
    if (e.evt.button === 0) {
      const pointer = e.target.getStage()!.getPointerPosition()!;
      lastPointerDownPosition.current = pointer;
      mapState.getState().setPanning(true);
    }
  }, []);

  const onMouseLeave = useCallback((e: any) => {
    if (e.evt.button === 0) {
      mapState.getState().setPanning(false);
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (panning) {
      mapState.getState().setPanning(false);
    }
  }, [panning]);

  return (
    <div
      ref={parentRef}
      className="w-screen h-screen overflow-hidden bg-[#081118]"
    >
      <Stage
        width={width}
        ref={stage}
        height={height}
        scale={{ x: zoom, y: zoom }}
        x={camera.x}
        y={camera.y}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onPointerUp={onPointerUp}
      >
        <Entities gameId={game.id} />
      </Stage>
    </div>
  );
}
