import { Game } from "@/lib/games";
import { Scan, useScan } from "@/lib/scan";
import { KonvaNodeComponent, Layer, Stage, StageProps } from "react-konva";
import { useWindowSize } from "react-use";
import { MapStar } from "./Map/Star";
import { MapState, mapState, useZoom, zoomState } from "@/lib/map";
import { InnerScanCircle, OuterScanCircle } from "./Map/ScanCircle";
import { UseKeyOptions } from "react-use/lib/useKey";
import { HyperspaceCircle } from "./Map/HyperspaceCircle";
import { MapCarrier } from "./Map/Carrier";
import { CarrierLines } from "./Map/CarrierLines";
import { distance } from "@/lib/utils";

function Entities({ gameId }: { gameId: ID }) {
  const scan = useScan(gameId);
  const zoom = useZoom();
  const map = mapState();
  return useMemo(
    () => (
      <>
        <Layer listening={false}>
          {scan?.stars.map((star) => (
            <HyperspaceCircle
              key={keys(star.id, "hyperspace")}
              starId={star.id}
            />
          ))}
          {scan?.stars.map((star) => (
            <OuterScanCircle
              key={keys(star.id, "outerscan")}
              starId={star.id}
              zoom={zoom}
            />
          ))}
          {scan?.stars.map((star) => (
            <InnerScanCircle
              key={keys(star.id, "innerscan")}
              starId={star.id}
            />
          ))}
        </Layer>
        <Layer>
          {scan?.carriers.map((carrier) => (
            <CarrierLines key={carrier.id} carrierId={carrier.id} />
          ))}
          {scan?.stars.map((star) => (
            <MapStar
              key={star.id}
              starId={star.id}
              zoom={zoom}
              flightPlanningFor={map.flightPlanningFor}
              selectedEntities={map.selected}
            />
          ))}
          {scan?.carriers.map((carrier) => (
            <MapCarrier
              key={carrier.id}
              carrierId={carrier.id}
              zoom={zoom}
              selectedEntities={map.selected}
            />
          ))}
        </Layer>
      </>
    ),
    [map.flightPlanningFor, map.selected, scan?.carriers, scan?.stars, zoom]
  );
}

export function Map({ game }: { game: Game }) {
  const scan = useScan(game.id);
  const parentRef = useRef<HTMLDivElement>(null);
  const panning = mapState((s) => s.panning);
  const zoom = useZoom();
  const { width, height } = useWindowSize();
  const stage = React.useRef<any>(null);
  const lastPointerDownPosition = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const pr = parentRef.current;
    const handleWheel = (e: WheelEvent) => {
      const zs = zoomState.getState();
      const zoom = zs.zoom;

      const newZoom = clamp(5, zoom - (e.deltaY / 1000) * zoom, 500);
      zs.setZoom(newZoom);

      // that will zoom towards the center, but we want to zoom towards the mouse position
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

      currentStage.x(pointer.x - mousePointTo.x * newZoom);
      currentStage.y(pointer.y - mousePointTo.y * newZoom);
    };

    pr?.addEventListener("wheel", handleWheel);
    return () => pr?.removeEventListener("wheel", handleWheel);
  }, [height, width]);

  const onMouseUp = useCallback(
    (e: any) => {
      const pointer = e.target.getStage()!.getPointerPosition()!;
      if (
        e.evt.button === 0 &&
        distance(pointer, lastPointerDownPosition.current) < 2 &&
        scan
      ) {
        const zoom = zoomState.getState().zoom;
        const currentStage = stage.current as any; // fuck typescript
        if (!currentStage) return;
        const camera = {
          x: currentStage.x(),
          y: currentStage.y(),
        };

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

        const { setSelected, setFlightPlanningFor } = mapState.getState();

        setFlightPlanningFor(null);
        setSelected(
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
    [scan]
  );

  const onPointerMove = useCallback((e: any) => {
    if (mapState.getState().panning) {
      const currentStage = stage.current as any; // fuck typescript
      if (!currentStage) return;
      const camera = {
        x: currentStage.x(),
        y: currentStage.y(),
      };

      currentStage.x(camera.x + e.evt.movementX);
      currentStage.y(camera.y + e.evt.movementY);
    }
  }, []);

  const onPointerDown = useCallback((e: any) => {
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
    <div ref={parentRef} className="w-dvw h-dvh overflow-hidden bg-[#081118]">
      <Stage
        width={width}
        ref={stage}
        height={height}
        scale={{ x: zoom, y: zoom }}
        onMouseUp={onMouseUp}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onMouseLeave={onMouseLeave}
        onPointerUp={onPointerUp}
        onTap={onPointerUp}
      >
        <Entities gameId={game.id} />
      </Stage>
      <p className="absolute text-xs right-3 bottom-3 opacity-50">
        {process.env.NEXT_PUBLIC_COMMIT_SHA ?? "LOCAL DEV BUILD"}
      </p>
    </div>
  );
}
