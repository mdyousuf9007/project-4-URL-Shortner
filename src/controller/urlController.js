const urlModel = require("../model/urlModel");
const shortId = require("shortid");
const url = require("validator");
const axios = require("axios");
const redis = require("redis");
const { promisify } = require("util");

const urlRegex = function (match) {
  return /^[A-Za-z0-9 _\-]{7,14}$/.test(match);
};

//======================================== Redis & Casing ==========================================

//Connect to redis
const redisClient = redis.createClient(
  19343,
  "redis-19343.c264.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("p3r7GpZIctZOMmGomjarPsl8wWMf58Xu", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//============================================ Create Url Shorten API =======================================

const createUrl = async function (req, res) {
  try {
    let data = req.body;

    //if the body is empty
    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, msg: "Body is empty" });
    }
    //if the key is not present in the request body
    if (!data.longUrl) {
      return res
        .status(400)
        .send({ status: false, msg: "longUrl is required" });
    }
    //if the value is not in the string
    if (typeof data.longUrl != "string") {
      return res.status(400).send({ status: false, msg: "longUrl is invalid" });
    }
    // if the url is valid or not
    if (!url.isURL(data.longUrl)) {
      return res.status(400).send({ status: false, msg: "longUrl is invalid" });
    }
    // axios call
    let options = {
      method: "get",
      url: `${data.longUrl}`,
    };
    let verifyUrl = await axios(options)
      .then(() => data.longUrl)
      .catch(() => null);

    if (!verifyUrl) {
      return res
        .status(400)
        .send({
          status: false,
          msg: `This Link ${data.longUrl}, is not valid url.`,
        });
    }
    // If data present in Cache Memory
    let cacheUrl = await GET_ASYNC(`${data.longUrl}`);
    let cacheData = JSON.parse(cacheUrl);
    if (cacheData) {
      return res
        .status(200)
        .send({
          status: true,
          msg: "Shorten Url already Generated (From cache Memory)",
          data: cacheData,
        });
    } else {
      //If data present in Database
      let checkDb = await urlModel
        .findOne({ longUrl: data.longUrl })
        .select({ __v: 0, createdAt: 0, updatedAt: 0 });
      if (checkDb) {
        await SET_ASYNC(`${data.longUrl}`, JSON.stringify(checkDb));
        return res
          .status(200)
          .send({
            status: true,
            msg: "Shorten Url already Generated (From Database)",
            data: checkDb,
          });
      }
    }

    let urlCode = shortId.generate().toLowerCase();
    let shortUrl = `http://localhost:3000/${urlCode}`; //7g4s-8zlj

    data.urlCode = urlCode;
    data.shortUrl = shortUrl;

    let createData = await urlModel.create(data);
    let result = {
      _id: createData._id,
      longUrl: createData.longUrl,
      shortUrl: createData.shortUrl,
      urlCode: createData.urlCode,
    };
    // await SET_ASYNC(`${data.longUrl}`, JSON.stringify(result))
    return res.status(201).send({ status: true, data: result });
  } catch (err) {
    return res.status(500).send({ msg: err });
  }
};

//====================================== Get Url API =================================

const getUrl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    if (!urlRegex(urlCode))
      return res.status(400).send({ status: false, msg: "UrlCode is Invalid" });

    let checkUrlData = await GET_ASYNC(`${urlCode}`);
    let data = JSON.parse(checkUrlData);
    if (data) {
      return res.status(302).redirect(`${data.longUrl}`);
    } else {
      //if data is not present in cache
      let urlData = await urlModel.findOne({ urlCode: urlCode });
      if (!urlData) {
        return res
          .status(404)
          .send({
            status: false,
            msg: "URL Not Found, Please Enter Valid Shorten UrlCode.",
          });
      }

      // data in cache
      await SET_ASYNC(`${urlCode}`, JSON.stringify(urlData));
      return res.status(302).redirect(urlData.longUrl);
    }
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

//================== Exported Modules ========================

module.exports = { createUrl, getUrl };
