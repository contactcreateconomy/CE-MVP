import { notFound } from "next/navigation";

import { ThreadPage } from "@/components/discussion/thread-page";
import { getFeedData, getThreadDiscussionData } from "@/lib/adapters/content";

interface DiscussionThreadPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DiscussionThreadPage({ params }: DiscussionThreadPageProps) {
  const { id } = await params;
  const data = getThreadDiscussionData(id);

  if (!data) {
    notFound();
  }

  const { users } = getFeedData();

  return <ThreadPage thread={data.thread} comments={data.comments} users={users} />;
}
