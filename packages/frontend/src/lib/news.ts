import { request } from "./api";

export type Article = {
  id: ID;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  game: ID;
};

export async function fetchNews(gameId: ID) {
  return await request<Article[]>(`/games/${gameId}/news`);
}

export function useNews(gameId: ID | null | undefined): Article[] {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!gameId) return;
    fetchNews(gameId).then((data) => setArticles(data));
  }, [gameId]);

  return articles;
}
