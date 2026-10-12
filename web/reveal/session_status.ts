// How a session's status reads in a list: its label and its dot (UI sprint 162). The workspace
// picker's session rows and the records page each kept a copy of this map; this is the one.
// The statuses are the server's buckets (`SessionRow["status"]`): live, parked, interrupted, ended.

const LOOK: Record<string, { label: string; dot: string }> = {
  live: { label: "● running", dot: "#7fb3b8" },
  parked: { label: "◐ parked", dot: "#82a5c8" },
  interrupted: { label: "! interrupted", dot: "#c26058" },
  ended: { label: "◇ ended", dot: "#4a4e55" },
};

export function sessionStatusLook(status: string): { label: string; dot: string } {
  return LOOK[status] ?? { label: "· " + status, dot: "#4a4e55" };
}
