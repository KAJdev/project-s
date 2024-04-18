/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/Theme/Button";
import { Input } from "@/components/Theme/Input";
import { motion } from "framer-motion";
import { Sparkle } from "lucide-react";
import { Inter } from "next/font/google";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

const STAR_COUNT = 100;
const COLORS = ["#2056bc", "#bba7be", "#c0aa13", "#c25b00", "#ffa34c"];
const MOTDS = [
  "This is the space game you've been looking for.",
  "The final frontier. In your browser.",
  "The best god damn game you've ever played.",
  "The most unique 4X game ever made.",
  "A serious battle of wits.",
];

function Star() {
  const [loc] = useState({
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    isFilled: Math.random() > 0.5,
  });

  const centerRelativity = Math.abs(loc.x - 50) + Math.abs(loc.y - 50);

  return (
    <Sparkle
      className="absolute"
      style={{
        left: `${loc.x}vw`,
        top: `${loc.y}vh`,
        opacity: `${Math.min(
          1 - Math.max(0.1, 1 - centerRelativity / 50) * 1.5,
          0.6
        )}`,
      }}
      size={(1 - Math.max(0.1, 1 - centerRelativity / 50)) * 24}
      color={loc.color}
      fill={loc.isFilled ? "currentColor" : undefined}
    />
  );
}

export default function Home() {
  const [motd, setMotd] = useState(MOTDS[0]);
  useLayoutEffect(() => {
    // fuck hydration
    setMotd(MOTDS[Math.floor(Math.random() * MOTDS.length)]);
  }, []);

  return (
    <div
      className={classes(
        "w-screen h-screen flex gap-3 justify-center items-center flex-col select-none",
        inter.className
      )}
    >
      <div className="absolute w-screen h-screen overflow-hidden pointer-events-none">
        {Array.from({ length: STAR_COUNT }).map((_, i) => (
          <Star key={i} />
        ))}
      </div>

      <h1 className="text-[5rem] font-semibold font-mono opacity-75">
        Project S
      </h1>
      <motion.h2
        className="text-2xl text-center font-mono"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 0.4,
        }}
      >
        {motd}
      </motion.h2>
      <Button className="mt-5" href="/app">
        Login
      </Button>
    </div>
  );
}
