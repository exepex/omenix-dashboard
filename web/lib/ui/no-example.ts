// A view the data does not cover (stories W12): a query no example answers today, or one a backend does not publish
// yet. Any adapter may reject with it; a page shows it as such, never as an empty result that would read as "nothing
// matches". Pure.
export class NoExample extends Error {
  constructor(what: string) {
    super(`No example data for this view yet (${what}).`);
    this.name = "NoExample";
  }
}
