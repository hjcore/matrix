import { KeyvFile } from "keyv-file";
// import dotenv from 'dotenv-safe'
import Keyv from 'keyv'
import path from "path"
// import { oraPromise } from 'ora'

import { ChatGPTAPI } from 'chatgpt'


// dotenv.config()

/**
 * Demo CLI for testing message persistence with redis.
 *
 * ```
 * npx tsx demos/demo-persistence.ts
 * ```
 */
async function main() {
  const messageStore = new Keyv({ store: new KeyvFile({ filename: path.join("./storage", `chatgpt.json`) }) })

  let res

  {
    // create an initial conversation in one client
    const api = new ChatGPTAPI({
      apiKey: "test-apikey",
      messageStore,
      fetch: (url, options) => {
        // const defaultOptions = {
        //   agent: proxy("http://127.0.0.1:10900")
        // }
        // const mergedOptions = {
        //   ...defaultOptions,
        //   ...options
        // }
        // console.log("mergedOptions", mergedOptions)
        return fetch("https://openai.1rmb.tk/v1/chat/completions", options);
      }
    })

    const prompt = 'What are the top 5 anime of all time?'

    res = await api.sendMessage(prompt), {
      text: prompt
    }
    console.log('\n' + res.text + '\n')
  }

  {
    // follow up with a second client using the same underlying redis store
    // const api = new ChatGPTAPI({
    //   apiKey: "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",
    //   messageStore,
    //   fetch: (url, options) => {
    //     // const defaultOptions = {
    //     //   agent: proxy("http://127.0.0.1:10900")
    //     // }
    //     // const mergedOptions = {
    //     //   ...defaultOptions,
    //     //   ...options
    //     // }
    //     // console.log("mergedOptions", mergedOptions)
    //     return fetch("https://openai.1rmb.tk/v1/chat/completions", options);
    //   }
    // })

    // const prompt = 'Can you give 5 more?'

    // res = await api.sendMessage(prompt, {
    //   parentMessageId: res.id
    // }),
    // {
    //   text: prompt
    // }
    // console.log("trds---", res)
    // console.log('\n' + res.text + '\n')
  }

  // wait for redis to finish and then disconnect
  // await new Promise((resolve) => {
  //   setTimeout(() => {
  //     messageStore.disconnect()
  //     resolve()
  //   }, 1000)
  // })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})