import type { Comment } from "@/types";

const userIds = ["u1", "u2", "u3", "u4", "u5"];

const commentBodies = [
  "This angle is strong. The execution detail makes it immediately usable.",
  "I tested something similar last week and got nearly the same outcome.",
  "Would love a follow-up with your exact prompt structure and constraints.",
  "The framework is great, but where did the QA checks save most time?",
  "This is the clearest breakdown I have seen for this workflow.",
  "Can confirm this works better when combined with a short review pass.",
  "Super useful. I would add one more step before publishing.",
  "The data-backed explanation is exactly what this community needs.",
  "I tried your approach with multilingual content and it still held up.",
  "Big win on clarity. This would be great as a reusable template.",
  "Strong take. I disagree on one point but the method is solid.",
  "This helped me ship faster today, thanks for sharing the process.",
];

function makeComment(postId: string, postIndex: number, commentIndex: number): Comment {
  const id = `c${postIndex * 5 + commentIndex + 1}`;
  const createdAt = new Date(
    Date.UTC(
      2026,
      1,
      28 - ((postIndex + commentIndex) % 14),
      9 + (commentIndex % 9),
      (postIndex * 7 + commentIndex * 5) % 60,
    ),
  );

  return {
    id,
    postId,
    authorId: userIds[(postIndex + commentIndex + 1) % userIds.length],
    body: commentBodies[(postIndex + commentIndex) % commentBodies.length],
    createdAt: createdAt.toISOString(),
    upvotes: 6 + ((postIndex * 13 + commentIndex * 11) % 120),
  };
}

export const comments: Comment[] = Array.from({ length: 90 }, (_, postIndex) => {
  const postId = `p${postIndex + 1}`;
  return Array.from({ length: 5 }, (_, commentIndex) => makeComment(postId, postIndex, commentIndex));
}).flat();
