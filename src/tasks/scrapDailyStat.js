import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import spacetime from "spacetime";
import puppeteer from "puppeteer";

const docId = "xU5d3ppMXO";
const tableIds = {
  twitter: "grid-z9wBrPvsIK",
  instagramEunjae: "grid-7kfJ1sgARr",
  instagramMinji: "grid-uYb-hFvmNF"
};

export async function scrapDailyStat() {
  try {
    const yesterday = spacetime
      .now()
      .goto("Europe/Paris")
      .subtract(1, "day")
      .format("en-GB");
    const twitterInfo = await getTwitterInfo("eunjae_lee");
    const instagramEunjae = await getInstagramInfo("eunjae.dev");
    const instagramMinji = await getInstagramInfo("minji.mps");

    await insertToCoda(docId, tableIds.twitter, twitterInfo, yesterday);
    await insertToCoda(
      docId,
      tableIds.instagramEunjae,
      instagramEunjae,
      yesterday
    );
    await insertToCoda(
      docId,
      tableIds.instagramMinji,
      instagramMinji,
      yesterday
    );

    return {
      statusCode: 200,
      body: JSON.stringify({})
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }) // Could be a custom message or object i.e. JSON.stringify(err)
    };
  }
}

async function getTwitterInfo(username) {
  const dom = await getDom(`https://twitter.com/${username}`);
  const getValueByClassName = className =>
    dom.window.document.body
      .querySelector(`li.${className} span.ProfileNav-value`)
      .getAttribute("data-count");

  const tweets = getValueByClassName("ProfileNav-item--tweets");
  const following = getValueByClassName("ProfileNav-item--following");
  const followers = getValueByClassName("ProfileNav-item--followers");
  return { tweets, following, followers };
}

async function getInstagramInfo(username) {
  const dom = await getDom(`https://instagram.com/${username}`);
  const getValueByLabel = label =>
    Array.from(dom.window.document.querySelectorAll("a"))
      .find(a => a.textContent.includes(label))
      .querySelector("span").textContent;

  console.log("here1");
  const posts = getValueByLabel("posts");
  console.log("here2");
  const followers = getValueByLabel("followers");
  console.log("here3");
  const following = getValueByLabel("following");

  return { posts, followers, following };
}

async function getDom(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const dom = new JSDOM(await page.evaluate(() => document.body.innerHTML));
  await browser.close();
  return dom;
}

async function insertToCoda(docId, tableId, data, date) {
  const url = `https://coda.io/apis/v1beta1/docs/${docId}/tables/${tableId}/rows`;
  const payload = {
    rows: [
      {
        cells: Object.entries({
          ...data,
          date
        }).map(([column, value]) => ({ column, value }))
      }
    ]
  };
  const { ok, status, statusText } = await fetch(url, {
    method: "post",
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${process.env.CODA_TOKEN}`,
      "Content-Type": "application/json"
    }
  });
  if (!ok) {
    throw new Error(
      JSON.stringify({
        status,
        statusText
      })
    );
  }
}
