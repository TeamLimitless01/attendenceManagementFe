"use client";

import { SessionProvider } from "next-auth/react";
import PusherNotificationManager from "@/components/PusherNotificationManager";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <PusherNotificationManager />
            <ToastContainer />
            {children}
        </SessionProvider>
    );
}
