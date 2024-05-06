import { darken } from "./color";
import { usePlanet } from "./scan";

function stickyNumberFromUUID(uuid: string, max: number) {
  let sum = 0;
  for (let i = 0; i < uuid.length; i++) {
    sum += uuid.charCodeAt(i);
  }
  return sum % max;
}

export enum PlanetType {
  Ice,
  Rock,
  Gas,
  Terrestrial,
  Silicate,
  Ocean,
  Lava,
  Iron,
}

const LOCATIONS = {
  far: [PlanetType.Ice, PlanetType.Rock, PlanetType.Gas],
  medium: [PlanetType.Terrestrial, PlanetType.Silicate, PlanetType.Ocean],
  close: [
    PlanetType.Lava,
    PlanetType.Iron,
    PlanetType.Silicate,
    PlanetType.Rock,
  ],
} as const;

export async function generatePlanetImage(
  seed: number,
  distance: number
): Promise<string> {
  // This function generates a random planet surface based on distance from the star
  // far is >5 AU, medium is 3-5 AU, close is <3 AU
  // returns an SVG path
  const location =
    distance > 5
      ? LOCATIONS.far
      : distance > 3
      ? LOCATIONS.medium
      : LOCATIONS.close;

  const planetType = location[seed % location.length];

  const blob = await drawPlanetSurface(planetType, seed);
  return URL.createObjectURL(blob);
}

async function drawPlanetSurface(
  planetType: PlanetType,
  seed: number
): Promise<Blob> {
  const canvas = new OffscreenCanvas(100, 100);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  switch (planetType) {
    case PlanetType.Ice:
      drawIcePlanet(ctx, seed);
      break;
    case PlanetType.Rock:
      drawRockPlanet(ctx, seed);
      break;
    case PlanetType.Gas:
      drawGasPlanet(ctx, seed);
      break;
    case PlanetType.Terrestrial:
      drawTerrestrialPlanet(ctx, seed);
      break;
    case PlanetType.Silicate:
      drawSilicatePlanet(ctx, seed);
      break;
    case PlanetType.Ocean:
      drawOceanPlanet(ctx, seed);
      break;
    case PlanetType.Lava:
      drawLavaPlanet(ctx, seed);
      break;
    case PlanetType.Iron:
      drawIronPlanet(ctx, seed);
      break;
  }

  return canvas.convertToBlob();
}

function drawBasePlanet(
  ctx: OffscreenCanvasRenderingContext2D,
  color: string,
  seed: number
) {
  // draws the base planet with a random amount of darkening of the color
  const fill = darken(color, (seed % 200) - 100);

  ctx.beginPath();
  ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 45, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.closePath();
}

function drawAtmosphere(ctx: OffscreenCanvasRenderingContext2D, color: string) {
  ctx.beginPath();
  ctx.arc(ctx.canvas.width / 2, ctx.canvas.height / 2, 50, 0, Math.PI * 2);
  // radial gradient
  const gradient = ctx.createRadialGradient(
    ctx.canvas.width / 2,
    ctx.canvas.height / 2,
    50,
    ctx.canvas.width / 2,
    ctx.canvas.height / 2,
    0
  );
  gradient.addColorStop(0, color + "aa");
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.closePath();
}

function drawRandomLandmass(
  ctx: OffscreenCanvasRenderingContext2D,
  seed: number,
  color: string
) {
  // draw a random number of blobs, make sure they clip to be only inside the planet
  const blobs = Math.floor(seed % 10) + 5;

  // draw only within the planet
  ctx.globalCompositeOperation = "source-atop";

  // draw blobs of random size and color
  // use a mix of circles, ellipses, and rounded polygons
  for (let i = 0; i < blobs; i++) {
    const t = ["circle", "ellipse", "polygon"][seed % 3];

    ctx.beginPath();

    switch (t) {
      case "circle":
        ctx.arc(
          Math.random() * ctx.canvas.width,
          Math.random() * ctx.canvas.height,
          Math.random() * 20,
          0,
          Math.PI * 2
        );
        break;
      case "ellipse":
        ctx.ellipse(
          Math.random() * ctx.canvas.width,
          Math.random() * ctx.canvas.height,
          Math.random() * 20,
          Math.random() * 20,
          0,
          0,
          Math.PI * 2
        );
        break;
      case "polygon":
        ctx.moveTo(
          Math.random() * ctx.canvas.width,
          Math.random() * ctx.canvas.height
        );
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(
            Math.random() * ctx.canvas.width,
            Math.random() * ctx.canvas.height
          );
        }
        break;
    }

    ctx.fillStyle = darken(color, (seed % 200) - 100);
    ctx.fill();
    ctx.closePath();
  }

  ctx.globalCompositeOperation = "source-over";
}

function drawIcePlanet(ctx: OffscreenCanvasRenderingContext2D, seed: number) {
  drawBasePlanet(ctx, "#dbe3e1", seed);
  drawRandomLandmass(ctx, seed, "#728eca");
}

function drawRockPlanet(ctx: OffscreenCanvasRenderingContext2D, seed: number) {
  drawBasePlanet(ctx, "#9e8e61", seed);
  drawRandomLandmass(ctx, seed, "#746c4f");
  // drawAtmosphere(ctx, "#d0d6d6");
}

function drawGasPlanet(ctx: OffscreenCanvasRenderingContext2D, seed: number) {
  drawBasePlanet(ctx, "#e2ad13", seed);
  drawAtmosphere(ctx, "#894c0d");
}

function drawTerrestrialPlanet(
  ctx: OffscreenCanvasRenderingContext2D,
  seed: number
) {
  drawBasePlanet(ctx, "#153d63", seed);
  drawRandomLandmass(ctx, seed, "#51651c");
  drawAtmosphere(ctx, "#b7cadc");
}

function drawSilicatePlanet(
  ctx: OffscreenCanvasRenderingContext2D,
  seed: number
) {
  drawBasePlanet(ctx, "#804000", seed);
  drawRandomLandmass(ctx, seed, "#804000");
  drawAtmosphere(ctx, "#804000");
}

function drawOceanPlanet(ctx: OffscreenCanvasRenderingContext2D, seed: number) {
  drawBasePlanet(ctx, "#0000ff", seed);
  drawAtmosphere(ctx, "#0000ff");
}

function drawLavaPlanet(ctx: OffscreenCanvasRenderingContext2D, seed: number) {
  drawBasePlanet(ctx, "#ff0000", seed);
  drawRandomLandmass(ctx, seed, "#ff0000");
  drawAtmosphere(ctx, "#ff0000");
}

function drawIronPlanet(ctx: OffscreenCanvasRenderingContext2D, seed: number) {
  drawBasePlanet(ctx, "#404040", seed);
  drawRandomLandmass(ctx, seed, "#404040");
  drawAtmosphere(ctx, "#404040");
}

export function usePlanetImageURL(
  planetId: ID | undefined
): string | undefined {
  const [image, setImage] = useState<string | null>(null);
  const planet = usePlanet(planetId);

  useEffect(() => {
    if (!planet) return;
    generatePlanetImage(
      stickyNumberFromUUID(planet.id, 1000),
      planet.distance
    ).then(setImage);
  }, [planet?.id, planet?.distance, planet]);

  return image;
}

export function usePlanetImage(
  planetId: ID | undefined
): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const planet = usePlanetImageURL(planetId);

  useEffect(() => {
    if (!planet) return;
    const img = new Image();
    img.src = planet;
    img.onload = () => setImage(img);
  }, [planet]);

  return image;
}
