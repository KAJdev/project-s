import { Game } from "@/lib/games";
import { Scan, useGameScan, useScan } from "@/lib/scan";
import { KonvaNodeComponent, Layer, Stage, StageProps } from "react-konva";
import { useWindowSize, usePinchZoom } from "react-use";
import { MapStar } from "./Map/Star";
import { MapState, mapState, useZoom, zoomState } from "@/lib/map";
import { InnerScanCircle, OuterScanCircle } from "./Map/ScanCircle";
import { UseKeyOptions } from "react-use/lib/useKey";
import { HyperspaceCircle } from "./Map/HyperspaceCircle";
import { MapCarrier } from "./Map/Carrier";
import { CarrierLines } from "./Map/CarrierLines";
import { distance } from "@/lib/utils";
import { ZoomState } from "react-use/lib/usePinchZoom";
import { useShallow } from "zustand/react/shallow";
import { KonvaEventObject } from "konva/lib/Node";

function Entities() {
  const scan = useScan();
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
  return (
    <div className="w-dvw z-0 h-dvh overflow-hidden bg-[#081118]">
      <MapStage game={game} />
    </div>
  );
}

export function MapStage({ game }: { game: Game }) {
  const scan = useGameScan(game.id);
  const panning = mapState((s) => s.panning);
  const zoom = useZoom();
  const { width, height } = useWindowSize();
  const stage = React.useRef<any>(null);
  const lastPointerDownPosition = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const pr = stage.current?.content.parentElement;
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
      lastTouchMove.current = null;
      if (
        (e.evt.button === 0 || e.type === "touchend") &&
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

  const lastTouchMove = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const lastTouchDistance = useRef<number>(0);
  const onTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
    if (mapState.getState().panning) {
      e.evt.preventDefault();
      const currentStage = stage.current as any; // fuck typescript
      if (!currentStage) return;
      const camera = {
        x: currentStage.x(),
        y: currentStage.y(),
      };

      if (e.evt.touches.length > 1) {
        const t1 = e.evt.touches[0];
        const t2 = e.evt.touches[1];
        const touchDistance = Math.sqrt(
          Math.pow(t1.clientX - t2.clientX, 2) +
            Math.pow(t1.clientY - t2.clientY, 2)
        );
        const delta = lastTouchDistance.current - touchDistance;

        // now we gatta zoom
        const zs = zoomState.getState();
        const zoom = zs.zoom;

        const newZoom = clamp(5, zoom - (delta / 100) * zoom, 500);
        zs.setZoom(newZoom);

        // that will zoom towards the center, but we want to zoom towards the mouse position
        const midpoint = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        const mousePointTo = {
          x: (midpoint.x - currentStage.x()) / zoom,
          y: (midpoint.y - currentStage.y()) / zoom,
        };

        currentStage.x(midpoint.x - mousePointTo.x * newZoom);
        currentStage.y(midpoint.y - mousePointTo.y * newZoom);

        lastTouchDistance.current = touchDistance;
      } else {
        const pointer = e.target.getStage()!.getPointerPosition()!;
        const distance = {
          x: pointer.x - lastTouchMove.current.x,
          y: pointer.y - lastTouchMove.current.y,
        };

        lastTouchMove.current = pointer;
        currentStage.x(camera.x + distance.x);
        currentStage.y(camera.y + distance.y);
      }
    }
  }, []);

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

  const onPointerDown = useCallback(
    (e: KonvaEventObject<TouchEvent | PointerEvent>) => {
      if (
        ("button" in e.evt && e.evt.button === 0) ||
        e.type === "touchstart"
      ) {
        const pointer = e.target.getStage()!.getPointerPosition()!;
        lastPointerDownPosition.current = pointer;
        lastTouchMove.current = pointer;
        if ("touches" in e.evt && e.evt.touches.length > 1) {
          const t1 = e.evt.touches[0];
          const t2 = e.evt.touches[1];
          lastTouchDistance.current = Math.sqrt(
            Math.pow(t1.clientX - t2.clientX, 2) +
              Math.pow(t1.clientY - t2.clientY, 2)
          );
        }
        mapState.getState().setPanning(true);
      }
    },
    []
  );

  const onMouseLeave = useCallback((e: any) => {
    if (e.evt.button === 0) {
      mapState.getState().setPanning(false);
    }
  }, []);

  const onPointerUp = useCallback(() => {
    if (panning) {
      mapState.getState().setPanning(false);
      lastTouchMove.current = null;
    }
  }, [panning]);

  return (
    <>
      <Stage
        width={width}
        ref={stage}
        height={height}
        scale={{ x: zoom, y: zoom }}
        onMouseUp={onMouseUp}
        onMouseMove={onPointerMove}
        onPointerDown={onPointerDown}
        onMouseLeave={onMouseLeave}
        onPointerUp={onPointerUp}
        onTouchEnd={onMouseUp}
        onTouchMove={onTouchMove}
        onTouchStart={onPointerDown}
      >
        <Entities />
      </Stage>
      <a
        href="https://github.com/kajdev/project-s"
        target="_blank"
        rel="noreferrer"
        className="absolute text-xs right-3 bottom-3 opacity-50 hover:underline"
      >
        {process.env.NEXT_PUBLIC_COMMIT_SHA ?? "LOCAL DEV BUILD"}
      </a>
    </>
  );
}
