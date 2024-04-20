/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/Theme/Button";
import { StarBackground } from "@/components/Theme/StarBackground";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

const MOTDS = [
  "This is the space game you've been looking for.",
  "The final frontier. In your browser.",
  "The best god damn game you've ever played.",
  "The most unique 4X game ever made.",
  "A serious battle of wits.",
];

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
      <StarBackground centerAdapt />

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
