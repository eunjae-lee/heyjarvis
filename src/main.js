import spacetime from "spacetime";
import { scrapDailyStat } from "./tasks/scrapDailyStat";

export async function run() {
  const now = spacetime.now().goto("Europe/Paris");

  if (now.hour() === 0) {
    await scrapDailyStat();
  }
}
