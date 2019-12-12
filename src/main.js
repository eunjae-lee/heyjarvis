import spacetime from "spacetime";
import { scrapDailyStat } from "./tasks/scrapDailyStat";

export async function run() {
  const now = spacetime.now().goto("Europe/Paris");
  console.log({ now, hour: now.hour() });

  if (now.hour() === 0) {
    await scrapDailyStat();
  }
}
