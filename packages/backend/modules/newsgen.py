import re
from modules.db import Event, News, Star, Game
from modules.utils import gpt, print

ARTICLE_PROMPT = """You are a galactic news outlet writing about politics, war, and life in the galaxy. There are 3 major players occupying the inhabited systems.

{players}

Write a short article on the following event:

{event}

Here's the last 5 recent events for context:

{recent}

Leave out specifics such as ship counts as to not leak information to other players. Make the article feel like a real report, bring in quotes and more context to flesh out the article. Keep the article very short (1-2 paragraphs max). imitate modern war news stories.

provide the article in this format:

title: <title>
tags: <tag>, <tag>
content: <content>"""


async def create_article(game: Game, event: Event, stars: list[Star]):
    player_strings = []

    for player in game.members:
        player_stars = len(list(filter(lambda star: star.occupier == player.id, stars)))
        player_strings.append(f"{player.name} - {player_stars}/{len(stars)} systems")

    print(f"Generating article for event: {event.type}")

    # fetch 3 past events for context
    events = (
        await Event.find(Event.game == game.id, Event.id != event.id, fetch_links=True)
        .sort(-Event.created_at)
        .limit(5)
        .to_list(None)
    )

    print(f"Found {len(events)} past events")

    try:
        content = await gpt(
            ARTICLE_PROMPT.format(
                players="\n".join(player_strings),
                event=await event.data.format(),
                recent="\n\n".join([await e.data.format() for e in events]),
            ),
            [],
        )
    except Exception as e:
        print(f"Failed to generate article: {e}")
        raise e
        return

    print(content)

    # parse things
    title = re.search(r"title:(.*)", content, re.IGNORECASE).group(1).strip()
    tags = re.search(r"tags:(.*)", content, re.IGNORECASE).group(1).strip().split(", ")

    # allow for multi-line content
    article_content = (
        re.search(r"content:(.*)", content, re.DOTALL | re.IGNORECASE).group(1).strip()
    )

    print(f"Generated article: {title}")

    article = News(
        game=game.id,
        tags=tags,
        content=article_content,
        title=title,
    )

    await article.save()

    return article
