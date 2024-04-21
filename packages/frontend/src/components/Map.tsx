import { Game } from "@/lib/games";
import { useScan } from "@/lib/scan";
import { Layer, Stage } from "react-konva";
import { useWindowSize } from "react-use";
import { MapStar } from "./Map/Star";
import { mapState } from "@/lib/map";
import { ScanCircle } from "./Map/ScanCircle";

export function Map({ game }: { game: Game }) {
  const scan = useScan(game.id);
  const { zoom, camera, panning } = mapState();
  const { width, height } = useWindowSize();

  return (
    <div className="w-screen h-screen overflow-hidden">
      <Stage
        width={width}
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
