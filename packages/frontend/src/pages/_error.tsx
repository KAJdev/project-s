import { Siren } from "lucide-react";

export default function Page() {
  return (
    <div className="w-screen h-screen flex gap-3 justify-center items-center flex-col">
      <Siren size={64} className="text-red-400 mb-3" />
      <h1 className="text-2xl font-semibold">Uh Oh!</h1>
      <h2 className="text-lg opacity-40 text-center">
        Looks like something went wrong.
        <br />
        Try refreshing the page.
      </h2>
    </div>
  );
}
