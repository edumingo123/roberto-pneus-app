import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getDemoSession,
  getSession,
  isDemoMode,
} from "@/lib/auth/session";
import { listConversations } from "@/lib/data/chat";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Chat" };

async function resolveSession() {
  let session = await getSession();
  if (!session && isDemoMode()) session = getDemoSession();
  if (!session) session = getDemoSession();
  return session;
}

export default async function ChatPage() {
  const session = await resolveSession();
  const conversations = await listConversations(session.user);

  return (
    <div className="-mx-1 sm:mx-0">
      <Suspense
        fallback={<Skeleton className="h-[calc(100dvh-8rem)] w-full rounded-xl" />}
      >
        <ChatWorkspace
          initialConversations={conversations}
          currentUserId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
