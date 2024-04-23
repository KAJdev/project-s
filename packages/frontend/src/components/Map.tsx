import { Game } from "@/lib/games";
import { useScan } from "@/lib/scan";
import { KonvaNodeComponent, Layer, Stage, StageProps } from "react-konva";
import { useWindowSize } from "react-use";
import { MapStar } from "./Map/Star";
import { mapState } from "@/lib/map";
import { InnerScanCircle, OuterScanCircle } from "./Map/ScanCircle";
import { UseKeyOptions } from "react-use/lib/useKey";
import { HyperspaceCircle } from "./Map/HyperspaceCircle";

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function Map({ game }: { game: Game }) {
  const scan = useScan(game.id);
  const { zoom, camera, panning } = mapState();
  const { width, height } = useWindowSize();
  const stage = React.useRef<any>(null);
  const lastPointerDownPosition = useRef<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
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

    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, [camera.x, camera.y, height, width, zoom]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#081118]">
      <Stage
        width={width}
        ref={stage}
        height={height}
        scale={{ x: zoom, y: zoom }}
        x={camera.x}
        y={camera.y}
        onMouseUp={(e) => {
          const pointer = e.target.getStage()!.getPointerPosition()!;
          if (
            e.evt.button === 0 &&
            distance(pointer, lastPointerDownPosition.current) < 2
          ) {
            mapState.getState().setSelected(null);
          }
          if (panning) {
            mapState.getState().setPanning(false);
          }
        }}
        onTap={(e) => {
          mapState.getState().setSelected(null);
        }}
        onMouseMove={(e) => {
          if (mapState.getState().panning) {
            mapState.getState().setCamera({
              x: camera.x + e.evt.movementX,
              y: camera.y + e.evt.movementY,
            });
          }
        }}
        onMouseDown={(e) => {
          if (e.evt.button === 0) {
            const pointer = e.target.getStage()!.getPointerPosition()!;
            lastPointerDownPosition.current = pointer;
            mapState.getState().setPanning(true);
          }
        }}
        onMouseLeave={(e) => {
          if (e.evt.button === 0) {
            mapState.getState().setPanning(false);
          }
        }}
      >
        <Layer>
          {scan?.stars.map((star) => (
            <HyperspaceCircle
              key={star.id}
              scan={scan}
              starId={star.id}
              zoom={zoom}
            />
          ))}
        </Layer>
        <Layer>
          {scan?.stars.map((star) => (
            <OuterScanCircle
              key={star.id}
              scan={scan}
              starId={star.id}
              zoom={zoom}
            />
          ))}
          {scan?.stars.map((star) => (
            <InnerScanCircle
              key={star.id}
              scan={scan}
              starId={star.id}
              zoom={zoom}
            />
          ))}
        </Layer>
        <Layer>
          {scan?.stars.map((star) => (
            <MapStar key={star.id} scan={scan} starId={star.id} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
