import { ApiReference } from "@/layouts/APIReference";

export default function Page() {
  return (
    <ApiReference
      configuration={{
        spec: { url: `${process.env.NEXT_PUBLIC_API_URL}/docs/openapi.json` },
      }}
    />
  );
}
