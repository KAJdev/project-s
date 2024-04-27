/* eslint-disable @next/next/no-img-element */
import { HTMLHead } from "@/components/HTMLHead";
import { Button } from "@/components/Theme/Button";
import { StarBackground } from "@/components/Theme/StarBackground";
import { motion } from "framer-motion";
import Head from "next/head";

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
        "w-full h-dvh flex gap-3 justify-center items-center flex-col select-none"
      )}
    >
      <HTMLHead subtitle="A Space Game" />

      <StarBackground centerAdapt />

      <h1 className="text-[5rem] opacity-75">Project S</h1>
      <motion.h2
        className="text-2xl text-center"
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
