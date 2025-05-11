import { validateRequest } from "@/auth";
import { Metadata } from "next";


import prisma from "@/lib/prisma";
import ForumClient from "./ForumClient";


export const metadata: Metadata = {
  title: "Diễn đàn hỏi đáp",
  description: "Tương tác với những người học khác trong diễn đàn cộng đồng của chúng tôi",
};

const ForumPage = async () => {
  const { user } = await validateRequest();
  const isAdmin = user?.role === "ADMIN";

  const categories = await prisma.forumCategory.findMany({
    include: {
      _count: {
        select: {
          topics: true,
        },
      },
      topics: {
        take: 1,
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          user: {
            select: {
              username: true,
              displayName: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return <ForumClient categories={categories} isAdmin={isAdmin} />;
};

export default ForumPage;
