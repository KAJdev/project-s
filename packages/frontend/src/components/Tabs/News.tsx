import { Article, useNews, useReadArticle } from "@/lib/news";
import { scanStore } from "@/lib/scan";
import { Button } from "../Theme/Button";
import { ArrowLeft } from "lucide-react";

function ArticleHeadline({
  article,
  onClick,
}: {
  article: Article;
  onClick: () => void;
}) {
  const [isRead, markAsRead] = useReadArticle(article.id);

  return (
    <div className="flex gap-3 items-center">
      <div
        className={classes(
          "inline w-2 h-2 shrink-0 bg-white",
          isRead && "bg-transparent"
        )}
      />

      <div
        className={classes(
          "flex flex-col gap-1 cursor-pointer opacity-60 hover:opacity-100 duration-100",
          !isRead && "opacity-90"
        )}
        onClick={() => {
          if (!isRead) markAsRead();
          onClick();
        }}
      >
        <p className="text-xs opacity-75">
          {new Date(article.created_at).toLocaleString()}
        </p>
        <div className="flex gap-2 items-center">
          <h3 className="text-lg">{article.title}</h3>
        </div>
        {article.tags.length > 0 && (
          <div className="flex gap-1 text-xs">
            {article.tags.map((tag) => (
              <span key={tag} className="bg-white/10 px-1">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ViewArticle({
  article,
  onBack,
}: {
  article: Article;
  onBack: () => void;
}) {
  return (
    <div className="p-4">
      <Button
        className="mb-2"
        onClick={onBack}
        icon={<ArrowLeft size={14} />}
        variant="transparent"
      >
        Back
      </Button>

      <h3 className="text-xl font-bold">{article.title}</h3>
      {article.tags.length > 0 && (
        <div className="flex gap-1 text-xs mt-1">
          {article.tags.map((tag) => (
            <span key={tag} className="bg-white/10 text-white/75 px-1">
              {tag}
            </span>
          ))}
        </div>
      )}
      <hr className="my-2 border border-white/20" />
      <p className="text-xs opacity-75">
        {new Date(article.created_at).toLocaleString()}
      </p>
      <div className="mt-4 text-sm opacity-90 whitespace-pre-line">
        {article.content}
      </div>
    </div>
  );
}

export function News() {
  const scan = scanStore((state) => state.scan);
  const articles = useNews(scan?.game);
  const [selected, setSelected] = useState<ID | null>(null);

  if (articles.length < 1) return <div className="p-4">No news yet...</div>;

  if (selected) {
    const article = articles.find((a) => a.id === selected);
    if (!article) return <div className="p-4">Article not found...</div>;
    return <ViewArticle article={article} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col gap-5 p-4 max-h-[40rem] overflow-y-auto">
      {articles.map((article, i) => (
        <>
          <ArticleHeadline
            key={article.id}
            article={article}
            onClick={() => setSelected(article.id)}
          />
          {i < articles.length - 1 && <hr className="border border-white/20" />}
        </>
      ))}
    </div>
  );
}
