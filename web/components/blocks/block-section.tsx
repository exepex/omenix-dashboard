// A page part's loader shell (stories W9, W12): reads the part's blocks through its data interface and renders them.
// A view the data does not cover (NoExample: a query no example answers) says so plainly; any other failure shows that
// part's error state while the rest of the page works. Server-side.
import type { ReactNode } from "react";
import { NoExample } from "../../lib/ui/no-example.ts";
import { EmptyState, ErrorState } from "../ui/states.tsx";

export async function blockSection<T>(what: string, read: () => Promise<T>, render: (blocks: T) => ReactNode): Promise<ReactNode> {
  let blocks: T;
  try {
    blocks = await read();
  } catch (e) {
    if (e instanceof NoExample) return <EmptyState title={`${what}: no example data for this view yet`}>The examples cover the signed-off states only; this view shows once a backend publishes the data.</EmptyState>;
    return <ErrorState problem={{ title: `${what}: data not available`, status: 503, detail: "This part could not be read; the rest of the page works." }} />;
  }
  return render(blocks);
}
