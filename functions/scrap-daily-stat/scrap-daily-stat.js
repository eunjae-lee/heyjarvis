/* eslint-disable */
const fetch = require("node-fetch");
const chromium = require("chrome-aws-lambda");
const { JSDOM } = require("jsdom");
const spacetime = require("spacetime");
require("dotenv").config();

const docId = "xU5d3ppMXO";
const tableIds = {
  twitter: "grid-z9wBrPvsIK",
  instagramEunjae: "grid-7kfJ1sgARr",
  instagramMinji: "grid-uYb-hFvmNF"
};

// https://bitsofco.de/how-to-use-puppeteer-in-a-netlify-aws-lambda-function/
exports.handler = async function(event, context) {
  try {
    const twitterInfo = await getTwitterInfo("eunjae_lee");
    const instagramEunjae = await getInstagramInfo("eunjae.dev");
    const instagramMinji = await getInstagramInfo("minji.mps");

    await insertToCoda(docId, tableIds.twitter, twitterInfo);
    await insertToCoda(docId, tableIds.instagramEunjae, instagramEunjae);
    await insertToCoda(docId, tableIds.instagramMinji, instagramMinji);

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
};

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

  const posts = getValueByLabel("posts");
  const followers = getValueByLabel("followers");
  const following = getValueByLabel("following");

  return { posts, followers, following };
}

async function getDom(url) {
  const browser = await chromium.puppeteer.launch({
    executablePath: await chromium.executablePath
  });
  const page = await browser.newPage();
  await page.goto(url);

  const dom = new JSDOM(await page.evaluate(() => document.body.innerHTML));
  await browser.close();
  return dom;
}

async function insertToCoda(docId, tableId, data) {
  const url = `https://coda.io/apis/v1beta1/docs/${docId}/tables/${tableId}/rows`;
  const payload = {
    rows: [
      {
        cells: Object.entries({
          ...data,
          date: spacetime
            .now()
            .goto("Europe/Paris")
            .format("en-GB")
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
