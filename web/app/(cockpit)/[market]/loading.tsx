// The page loader (story W14): Next.js shows it on the first load of a screen and on every move to another screen,
// inside the app frame (the rail, app bar and picks panel stay usable), until the screen's server part is drawn.
import { PageLoading } from "../../../components/ui/loading.tsx";

export default function Loading() {
  return <PageLoading />;
}
