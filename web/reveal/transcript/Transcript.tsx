// Sprint 071 — mount seam stub. Renders nothing; the mount div is
// visible in the DOM but the transcript is blank when the atom-
// transcript flag is on. Sprint 072 replaces this stub with the real
// row-rendering subtree.

import * as React from "react";

export interface TranscriptProps {
  paneId: number;
  view: "terminal" | "reveal";
}

export function Transcript(_props: TranscriptProps): React.ReactElement | null {
  return null;
}
