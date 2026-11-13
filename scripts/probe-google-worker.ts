/** Temporary probe for Google News access from Workers. */
export default {
  async fetch(): Promise<Response> {
    const urls = [
      "https://trends.google.com/trending/rss?geo=ID",
      "https://trends.google.co.id/trending/rss?geo=ID",
      "https://www.bing.com/news/search?q=&qft=interval%3d%221%22&form=PTFTNR&format=rss&mkt=id-ID",
      "https://www.bing.com/news/search?q=Indonesia&format=rss&mkt=id-ID",
      "https://news.search.yahoo.com/news/rss?p=Indonesia&eo=UTF-8&intl=id",
      "https://api.codetabs.com/v1/proxy?quest=" +
        encodeURIComponent("https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id"),
      "https://thingproxy.freeboard.io/fetch/https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id",
    ];
    const results = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml, application/json, text/plain, */*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
            "X-Return-Format": "text",
          },
        });
        const text = await res.text();
        results.push({
          url: url.slice(0, 100),
          status: res.status,
          len: text.length,
          snippet: text.slice(0, 160).replace(/\s+/g, " "),
          items: (text.match(/<item>/g) || []).length,
          hasRss: text.includes("<rss") || text.includes("<item>"),
          hasJson: text.trimStart().startsWith("{"),
        });
      } catch (e) {
        results.push({ url: url.slice(0, 100), error: String(e) });
      }
    }
    return Response.json(results);
  },
};
