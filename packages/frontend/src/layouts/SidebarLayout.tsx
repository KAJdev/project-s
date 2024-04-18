import { CreateChannel } from "@/components/Modals/CreateChannel";
import { Profile } from "@/components/Modals/Profile";
import { UserModals } from "@/components/Modals/User";
import { Avatar } from "@/components/Theme/Avatar";
import { Button } from "@/components/Theme/Button";
import { Sidebar } from "@/components/Theme/Sidebar";
import { channelStore } from "@/lib/channels";
import { openModal } from "@/lib/modal";
import { useSelf, useUser } from "@/lib/users";
import { Hash, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { create } from "zustand";

export const uploadModalState = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function SidebarLayout() {
  const navigate = useNavigate();
  const { channelId } = useParams();
  const { channels } = channelStore();
  const user = useSelf();

  // select the first channel if none is selected
  useEffect(() => {
    if (!channelId && channels.length > 0) {
      navigate(`/app/channels/${channels[0].id}`);
    }
  }, [channelId, channels, navigate]);

  return (
    <>
      <Sidebar>
        <div
          className="rounded secondary-panel-interactive items-center p-3 flex gap-3 mb-4"
          onClick={() => openModal("profileSettings")}
        >
          <Avatar variant="small" user={user} />
          <p className="truncate select-none">
            {user?.display_name || user?.username}
          </p>
        </div>
        {channels.map((channel) => (
          <Button
            key={channel.id}
            active={channel.id === channelId}
            icon={<Hash className="opacity-50" size={14} />}
            variant="transparent"
            onClick={() => navigate(`/app/channels/${channel.id}`)}
          >
            {channel.name}
          </Button>
        ))}
        <Button
          icon={<Plus size={14} />}
          className="border-dashed"
          variant="outline"
          onClick={() => openModal("createChannel")}
        >
          Create Channel
        </Button>
      </Sidebar>
      <CreateChannel />
      <Profile />
      <UserModals />
    </>
  );
}
