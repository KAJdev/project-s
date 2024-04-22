import { Game } from "@/lib/games";
import { useScan } from "@/lib/scan";
import { KonvaNodeComponent, Layer, Stage, StageProps } from "react-konva";
import { useWindowSize } from "react-use";
import { MapStar } from "./Map/Star";
import { mapState } from "@/lib/map";
import { ScanCircle } from "./Map/ScanCircle";
import { UseKeyOptions } from "react-use/lib/useKey";

export function Map({ game }: { game: Game }) {
  const scan = useScan(game.id);
  const { zoom, camera, panning } = mapState();
  const { width, height } = useWindowSize();
  const stage = React.useRef<any>(null);

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
    <div className="w-screen h-screen overflow-hidden">
      <Stage
        width={width}
        ref={stage}
        height={height}
        scale={{ x: zoom, y: zoom }}
        x={camera.x}
        y={camera.y}
        onMouseUp={(e) => {
          if (e.evt.button === 0) {
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
            <ScanCircle key={star.id} scan={scan} starId={star.id} />
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
