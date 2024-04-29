import { Article, useNews, useReadArticle } from "@/lib/news";
import { scanStore } from "@/lib/scan";
import { Button } from "../Theme/Button";
import { ArrowLeft } from "lucide-react";
import { request } from "@/lib/api";
import { Textarea } from "../Theme/Textarea";

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
          {new Date(article.created_at).toLocaleString()} -{" "}
          {article.outlet_name}
        </p>
        {article.tags.length > 0 && (
          <div className="flex gap-1 text-xs flex-wrap">
            {article.tags.map((tag) => (
              <span key={tag} className="bg-white/10 px-1">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <h3 className="text-lg">{article.title}</h3>
        </div>
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
        <div className="flex gap-1 text-xs mt-1 flex-wrap">
          {article.tags.map((tag) => (
            <span key={tag} className="bg-white/10 text-white/75 px-1">
              {tag}
            </span>
          ))}
        </div>
      )}
      <hr className="my-2 border border-white/20" />
      <p className="text-xs opacity-75">
        {new Date(article.created_at).toLocaleString()} - {article.outlet_name}
      </p>
      <div className="mt-4 text-sm opacity-90 whitespace-pre-line">
        {article.content}
      </div>
    </div>
  );
}

function MakeStatement({ gameId }: { gameId: ID }) {
  const [statement, setStatement] = useState<string>("");
  const [statementLoading, setStatementLoading] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-2 p-4 border-b border-white/20 bg-white/5">
      <div className="flex justify-between items-center">
        <h1>Galactic Statement</h1>
        <Button
          onClick={async () => {
            if (statement.trim().length < 1) return;
            setStatementLoading(true);

            request<Article>(`/games/${gameId}/statements`, {
              method: "POST",
              body: { content: statement },
            }).then(() => {
              setStatement("");
              setStatementLoading(false);
            });
          }}
          loading={statementLoading}
          disabled={statement.trim().length < 1}
        >
          Declare
        </Button>
      </div>
      <Textarea
        value={statement}
        onChange={(e) => setStatement(e)}
        placeholder="Make a statement..."
      />
    </div>
  );
}

export function News() {
  const scan = scanStore((state) => state.scan);
  const articles = useNews(scan?.game);
  const [selected, setSelected] = useState<ID | null>(null);

  if (!scan) return <div className="p-4">No game selected...</div>;

  if (articles.length < 1) return <div className="p-4">No news yet...</div>;

  if (selected) {
    const article = articles.find((a) => a.id === selected);
    if (!article) return <div className="p-4">Article not found...</div>;
    return <ViewArticle article={article} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col">
      <MakeStatement gameId={scan.game} />
      <div className="flex flex-col gap-5 p-4 max-h-[30rem] overflow-y-auto">
        {articles.map((article, i) => (
          <>
            <ArticleHeadline
              key={article.id}
              article={article}
              onClick={() => setSelected(article.id)}
            />
            {i < articles.length - 1 && (
              <hr className="border border-white/20" />
            )}
          </>
        ))}
      </div>
    </div>
  );
}
