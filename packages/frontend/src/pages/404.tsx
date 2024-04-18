import { Construction } from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="w-screen h-screen flex gap-3 justify-center items-center flex-col">
      <Construction size={64} className="text-blue-400 mb-3" />
      <h1 className="text-2xl font-semibold">Hmm...</h1>
      <h2 className="text-lg opacity-40 text-center">
        This page doesn&apos;t exist.
      </h2>
      <Link href="/" className="text-blue-500 hover:underline">
        Go Home
      </Link>
    </div>
  );
}
