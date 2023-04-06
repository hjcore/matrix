import { ChatGPTAPI } from 'chatgpt';
import { MatrixClient } from 'matrix-bot-sdk';
import fetch from 'node-fetch';
import { OPENAI_TOKEN } from "../env.js";

let chatGPTAPIInstance: ChatGPTAPI | null = null;

export function installChatGTPAPI () {
  chatGPTAPIInstance =  new ChatGPTAPI({
    apiKey: OPENAI_TOKEN || '',
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
  });
}

interface GraphOfRoomId {
  roomId: string;
  conversationId: string;
}
enum ReservedCommand {
  END = "end"
}
type CommandsResolver = {
  [key in ReservedCommand]: (matrixClient: MatrixClient) => boolean
}

let graphOfRoomId: GraphOfRoomId[]  = []
let commandsResolver: CommandsResolver = {
  "end": (matrixClient) => {
    return true
  }
}

export function findConversationListInGraph(roomId: string) {
  return graphOfRoomId.find(elm => elm.roomId === roomId)
}

export function createNewRoomConversation(roomId: string, conversationId: string) {
  graphOfRoomId.push({
    roomId,
    conversationId
  })
}

export function commandObserver(message: string, matrixClient: MatrixClient) {
  const matchCommandResolver = commandsResolver[message]
  if (matchCommandResolver) {
    return matchCommandResolver(matrixClient)
  }
  return false
}

export function handleConversationAndRoom(conversationId: string, roomId: string) {
  const matchConversationDescriptor = findConversationListInGraph(roomId)
  if (matchConversationDescriptor) {
    // has conversation history
    // update conversation id 
    matchConversationDescriptor.conversationId = conversationId
  } else {
    // create new room conversation
    createNewRoomConversation(roomId, conversationId)
  }
}


export async function sendMessage(roomId: string, message: string) {
  if (!chatGPTAPIInstance) return
  const historyConversation = findConversationListInGraph(roomId);
  let matchCoverationId: string | undefined
  if (historyConversation) {
    matchCoverationId = historyConversation.conversationId
  } else {
    matchCoverationId = undefined
  }
  const response = await chatGPTAPIInstance.sendMessage(message, {
    parentMessageId: matchCoverationId
  });

  // update conversation id or push conversation id
  handleConversationAndRoom(response.id, roomId)

  return response.text
}
