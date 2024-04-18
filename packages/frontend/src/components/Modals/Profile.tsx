import { useModal } from "@/lib/modal";
import { Body, BottomBar, Modal, Panel, Title, TopBar } from "../Theme/Modal";
import { Button } from "../Theme/Button";
import { Input } from "../Theme/Input";
import { createChannel } from "@/lib/channels";
import { Hash } from "lucide-react";
import { updateSelf, useSelf } from "@/lib/users";
import { Textarea } from "../Theme/Textarea";

export function Profile() {
  const [open, , setClosed] = useModal("profileSettings");
  const user = useSelf();

  const [displayName, setDisplayname] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(user?.banner_url || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayname(user?.display_name || "");
    setBio(user?.bio || "");
    setAvatarUrl(user?.avatar_url || "");
    setBannerUrl(user?.banner_url || "");
  }, [user]);

  return (
    <Modal onClose={setClosed} open={open}>
      <Panel>
        <TopBar onClose={setClosed} border={false}>
          <Title>Profile</Title>
        </TopBar>
        <Body className="flex flex-col gap-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={setDisplayname}
            placeholder="Spongebob Squarepants"
          />
          <Textarea
            label="Bio"
            value={bio}
            onChange={setBio}
            placeholder=":wires:"
            minRows={3}
            maxRows={6}
          />
          <Input
            label="Avatar URL"
            value={avatarUrl}
            onChange={setAvatarUrl}
            placeholder="https://example.com/avatar.png"
          />
          <Input
            label="Banner URL"
            value={bannerUrl}
            onChange={setBannerUrl}
            placeholder="https://example.com/banner.png"
          />
        </Body>
        <BottomBar>
          <div className="flex items-center justify-between w-full flex-row-reverse">
            <div className="flex gap-2 justify-end shrink-0">
              <Button
                variant="transparent"
                className="flex-grow-0"
                onClick={setClosed}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className=""
                loading={loading}
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  updateSelf({
                    display_name: displayName,
                    bio,
                    avatar_url: avatarUrl,
                    banner_url: bannerUrl,
                  })
                    .then(() => {
                      setLoading(false);
                      setClosed();
                    })
                    .catch((e) => {
                      setLoading(false);
                      setError(e.message);
                    });
                }}
              >
                Save
              </Button>
            </div>

            {error && <p className="text-red-500 text-sm truncate">{error}</p>}
          </div>
        </BottomBar>
      </Panel>
    </Modal>
  );
}
