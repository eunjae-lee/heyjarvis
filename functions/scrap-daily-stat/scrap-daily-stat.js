/* eslint-disable */
const fetch = require("node-fetch");
const chromium = require("chrome-aws-lambda");
const { JSDOM } = require("jsdom");

// https://bitsofco.de/how-to-use-puppeteer-in-a-netlify-aws-lambda-function/
exports.handler = async function(event, context) {
  try {
    const twitterInfo = await getTwitterInfo("eunjae_lee");
    const eunjaeInstgram = await getInstagramInfo("eunjae.dev");
    const minjiInstgram = await getInstagramInfo("minji.mps");

    return {
      statusCode: 200,
      body: JSON.stringify({
        msg: "hey",
        twitterInfo,
        eunjaeInstgram,
        minjiInstgram
      })
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
  const browser = await chromium.puppeteer.launch({});
  const page = await browser.newPage();
  await page.goto(url);

  const dom = new JSDOM(await page.evaluate(() => document.body.innerHTML));
  await browser.close();
  return dom;
}
