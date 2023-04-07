import { MatrixClient } from "matrix-bot-sdk";
import { MessageEvent, RelatesTo } from "./types.js";
import Markdown from "markdown-it";
import { sendMessage, installChatGTPAPI } from "./chatgpt_model.js";
import { sendError } from "../utils.js";
import { MATRIX_ROOM_BLACK_LIST, MATRIX_USER_BLACK_LIST } from "../env.js";

installChatGTPAPI(); // initial gpt instance
const markdown = Markdown(); // initial markdown

async function isRoboteMessage(messageEvent: MessageEvent, client: MatrixClient) {
  const roboteId = await client.getUserId();
  return roboteId === messageEvent.sender;
}

function isBlockUserMessage(sender: string) {
  return MATRIX_USER_BLACK_LIST.includes(sender);
}

function isBlockRoomMessage(roomId: string) {
  return MATRIX_ROOM_BLACK_LIST.includes(roomId);
}

function messageFrom10sAgo(event: MessageEvent) {
  return  Date.now() - event.origin_server_ts > 10000;
}

function messageIsNotText(event: MessageEvent) {
  return event.content.msgtype !== "m.text";
}

function messageIsEditMessage(event: MessageEvent) {
  return event.content["m.relates_to"]?.["rel_type"] === "m.replace"
}

function getRootEventId(event: MessageEvent) {
  const relatesTo: RelatesTo | undefined = event.content["m.relates_to"];
  return (relatesTo && relatesTo.event_id !== undefined) ? relatesTo.event_id : event.event_id;
}

/**
 * 
 * message will be ignored in following cases:
 * 1. message from robote itself: yep, message from the robote also will triggered message event 
 * 2. message from the black list
 * 3. old message(from 10s ago)
 * 4. not text 
 * 5. user edit message
 */
async function messageShouldBeIgnore(roomId: string, messageEvent: MessageEvent, client: MatrixClient) {
  const messageIsFromRobote = await isRoboteMessage(messageEvent, client);
  if (messageIsFromRobote) return true;
  if (isBlockUserMessage(messageEvent.sender)) return true;
  if (isBlockRoomMessage(roomId)) return true;
  if (messageFrom10sAgo(messageEvent)) return true;
  if (messageIsNotText(messageEvent)) return true;
  if (messageIsEditMessage(messageEvent)) return true;
  return false
}

function checkIsThread(messageEvent: MessageEvent) {
  return messageEvent.content["m.relates_to"]?.rel_type?.includes("thread")
}

export async function sendReply(client: MatrixClient, roomId: string, rootEventId: string, text: string, thread: boolean = false, rich:boolean = false): Promise<void> {

  const contentCommon = {
    body: text,
    msgtype: "m.text",
  }

  const contentThreadOnly = {
    "m.relates_to": {
      event_id: rootEventId,
      is_falling_back: true,
      "m.in_reply_to": {
        "event_id": rootEventId
      },
      rel_type: "m.thread"
    }
  }

  const contentTextOnly = {
    "org.matrix.msc1767.text": text,
  }

  const renderedText = markdown.render(text)

  const contentRichOnly = {
    format: "org.matrix.custom.html",
    formatted_body: renderedText,
    "org.matrix.msc1767.message": [
      {
        "body": text,
        "mimetype": "text/plain"
      },
      {
        "body": renderedText,
        "mimetype": "text/html"
      }
    ]
  }

  console.log("is thread", thread)

  const content = rich ? { ...contentCommon, ...contentRichOnly } : { ...contentCommon, ...contentTextOnly };
  const finalContent = thread ? { ...content, ...contentThreadOnly } : content

  console.log("------ finalContent", finalContent)

  await client.sendEvent(roomId, "m.room.message", finalContent);
}


export default async function messageObserver(roomId: string, messageEvent: MessageEvent, client: MatrixClient) {

  console.log("message is comming", messageEvent, client, roomId)

  const shouldBeIgnore = await messageShouldBeIgnore(roomId, messageEvent, client)
  
  if (shouldBeIgnore) return;

  // set the robote typing mode
  client.setTyping(roomId, true, 60000) // 60s timeout

  const chatGPTResponse = await sendMessage(roomId, messageEvent.content.body).catch(error => {
    sendError(client, "The bot has encountered an error, please contact your administrator.", roomId, messageEvent.event_id)
  });

  const isThread = checkIsThread(messageEvent);

  await Promise.all([
    client.setTyping(roomId, false, 500),
    sendReply(client, roomId, getRootEventId(messageEvent), `${chatGPTResponse}`, isThread, true)
  ]);

}