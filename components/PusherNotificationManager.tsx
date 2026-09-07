"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { toast } from "react-toastify";

export default function PusherNotificationManager() {
  useEffect(() => {
    // Enable pusher logging for debugging
    Pusher.logToConsole = process.env.NODE_ENV !== "production";

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "9ed624d63246efc34405", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
    });

    const channel = pusher.subscribe("attendance-channel");

    channel.bind("attendance-marked", function (data: any) {
      toast.success(data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    });

    return () => {
      pusher.unsubscribe("attendance-channel");
      pusher.disconnect();
    };
  }, []);

  return null;
}
