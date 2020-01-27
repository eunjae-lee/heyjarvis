import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import spacetime from "spacetime";
import puppeteer from "puppeteer";
import Twitter from "twitter";

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
    const instagramMinji = await getInstagramInfo("merearchive");

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
  const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });
  const {
    statuses_count: tweets,
    friends_count: following,
    followers_count: followers
  } = await client.get("users/show", { screen_name: username });

  return { tweets, following, followers };
}

async function getInstagramInfo(username) {
  const dom = await getDom(`https://instagram.com/${username}`);
  const getValueByLabel = label =>
    Array.from(dom.window.document.querySelectorAll("a"))
      .find(a => a.textContent.includes(label))
      .querySelector("span").textContent;

  const posts = getValueByLabel("posts");
  const followers = getValueByLabel("followers");
  const following = getValueByLabel("following");

  return { posts, followers, following };
}

async function getDom(url, selector = null) {
  const browser = await puppeteer.launch();
  // const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  if (selector) {
    await page.waitForSelector(selector);
  }
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
