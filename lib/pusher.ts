import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "2192480",
  key: process.env.PUSHER_KEY || "9ed624d63246efc34405",
  secret: process.env.PUSHER_SECRET || "f59c05f2dfe590edeae5",
  cluster: process.env.PUSHER_CLUSTER || "ap2",
  useTLS: true,
});
