import { create } from "zustand";
import { request } from "./api";
import { scanStore, useScan } from "./scan";
import { persist } from "zustand/middleware";

export type Article = {
  id: ID;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  game: ID;
  outlet_name: string;
};

export const newsReadReciepts = create(
  persist<{
    read: ID[];
    setRead: (id: ID) => void;
  }>(
    (set) => ({
      read: [],
      setRead: (id) =>
        set((state) => {
          if (state.read.includes(id)) return state;
          return { read: [...state.read, id] };
        }),
    }),
    {
      name: "newsReadReceipts",
    }
  )
);

export async function fetchNews(gameId: ID) {
  return await request<Article[]>(`/games/${gameId}/news`);
}

export function useNews(gameId: ID | null | undefined): Article[] {
  const [articles, setArticles] = useState<Article[]>([]);
  const scan = useScan();

  useEffect(() => {
    if (!gameId) return;
    fetchNews(gameId).then((data) => setArticles(data));
  }, [gameId, scan]);

  return articles;
}

export function useReadArticle(id: ID): [boolean, () => void] {
  const [read, setRead] = newsReadReciepts((state) => [
    state.read,
    state.setRead,
  ]);

  const isRead = read.includes(id);
  return [isRead, () => setRead(id)] as const;
}
