import { request } from "@/lib/api";
import { tokenStore } from "@/lib/token";
import { User, userStore } from "@/lib/users";
import { useRouter } from "next/router";
import { Body, Title, TopBar } from "@/components/Theme/Modal";
import { Input } from "@/components/Theme/Input";
import { Button } from "@/components/Theme/Button";
import Link from "next/link";
import { StarBackground } from "@/components/Theme/StarBackground";
import { HTMLHead } from "@/components/HTMLHead";

export function AuthLayout({ mode = "login" }: { mode?: "login" | "signup" }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setError("");
    setLoading(true);
    const userWithToken = await request<User>(
      mode === "login" ? "/login" : "/signup",
      {
        method: "POST",
        body: { username, password, ...(mode === "signup" ? { email } : {}) },
        throwErrors: true,
      }
    ).catch((e) => {
      setError(e.message);
      setLoading(false);
    });

    if (userWithToken) {
      userStore.getState().setUser(userWithToken);

      if ("token" in userWithToken && userWithToken.token) {
        tokenStore.getState().setToken(userWithToken.token as string);
        router.push("/app");
      }
    }
  }, [mode, username, password, email, router]);

  const validate = useCallback(() => {
    if (mode === "login") {
      return username && password;
    } else {
      return username && password && email && email.includes("@");
    }
  }, [mode, username, password, email]);

  return (
    <div
      className={classes(
        "w-dvw h-dvh flex items-end sm:items-center justify-center"
      )}
    >
      <HTMLHead subtitle={mode === "login" ? "Login" : "Sign Up"} />
      <StarBackground centerAdapt />
      <div className="max-w-[35rem] w-full primary-panel-solid p-2">
        <TopBar border={false}>
          <Title>
            {mode === "login" ? "Welcome Back" : "Create an Account"}
          </Title>
        </TopBar>
        <Body className="flex flex-col gap-4">
          <Input
            label={mode === "login" ? "Username or Email" : "Username"}
            value={username}
            onChange={setUsername}
          />
          {mode === "signup" && (
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
            />
          )}
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
          />
          <Button
            variant="vibrant"
            className="w-full justify-center"
            loading={loading}
            onClick={handleLogin}
            disabled={!validate()}
          >
            {mode === "login" ? "Login" : "Sign Up"}
          </Button>
          {error && <p className="text-red-500 text-sm truncate">{error}</p>}
          <p className="text-sm text-white/50">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  className="text-blue-500 hover:underline cursor-pointer"
                  href="/signup"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  className="text-blue-500 hover:underline cursor-pointer"
                  href="/login"
                >
                  Login
                </Link>
              </>
            )}
          </p>
        </Body>
      </div>
    </div>
  );
}
