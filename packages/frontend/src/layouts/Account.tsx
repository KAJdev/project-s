import { UserProfile } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

export function Account() {
  return (
    <div className="flex w-full h-full max-h-screen overflow-y-auto items-center justify-center">
      <div className="my-auto">
        <UserProfile
          appearance={{
            variables: {
              borderRadius: "0.1rem",
              colorBackground: "transparent",
              shadowShimmer: "none",
            },
            baseTheme: dark,
          }}
        />
      </div>
    </div>
  );
}
