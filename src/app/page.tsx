import NewsApp from "@/components/NewsApp";
import { getNewsFeed } from "@/lib/fetch-news";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await getNewsFeed();
  return <NewsApp initialData={initialData} />;
}
