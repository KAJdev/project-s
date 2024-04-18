import { useModal } from "@/lib/modal";
import { Body, BottomBar, Modal, Panel, Title, TopBar } from "../Theme/Modal";
import { Button } from "../Theme/Button";
import { Input } from "../Theme/Input";
import { createChannel } from "@/lib/channels";
import { Hash } from "lucide-react";

export function CreateChannel() {
  const [open, , setClosed] = useModal("createChannel");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Modal onClose={setClosed} open={open}>
      <Panel>
        <TopBar onClose={setClosed} border={false}>
          <Title>Create Channel</Title>
        </TopBar>
        <Body className="flex flex-col gap-4">
          <Input
            label="Channel Name"
            startIcon={<Hash size={14} />}
            value={name}
            onChange={setName}
            placeholder="Ooga Booga"
          />
          <Input
            label="Channel Description"
            value={description}
            onChange={setDescription}
            placeholder="Important discussions about important things."
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
                  createChannel(name, description)
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
                Create Channel
              </Button>
            </div>

            {error && <p className="text-red-500 text-sm truncate">{error}</p>}
          </div>
        </BottomBar>
      </Panel>
    </Modal>
  );
}
