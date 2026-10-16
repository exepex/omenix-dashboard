// The F&O paper books (story W3c, design/mockups/41-paper-books): India only; in the US the page does not exist
// (absent, not empty): it is built for India alone and any other market is a real 404.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaperBooksPage } from "./_parts/paper-books-page.tsx";

export const metadata: Metadata = { title: "Paper books" };

export function generateStaticParams() {
  return [{ market: "india" }];
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ market: string }> }) {
  if ((await params).market !== "india") notFound();
  return <PaperBooksPage />;
}
