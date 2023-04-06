type CommonMatrixEventFields = {
  origin_server_ts: number,
  sender: string,
  event_id: string
}

export type RelatesTo = {
  // The m.thread relationship structure
  event_id: string  // note: always references the *thread root*
  rel_type: "m.thread" | string
  // The rich reply structure (for non thread aware client fallback)
  "m.in_reply_to"?: {
    // The most recent message known to the client in the thread.
    // Something easy to render for other client like a `m.room.message` event.
    "event_id": string
  },
  // A flag to denote that this is a thread with reply fallback
  "is_falling_back": string
}

export type MessageEvent = CommonMatrixEventFields & {
  content: {
    body: string,
    msgtype: "m.text" | string
    "org.matrix.msc1767.text"?: string,
    "m.relates_to"?: RelatesTo
  },
  raw: any,
  "type": "m.room.message",
  unsigned: Object;
}