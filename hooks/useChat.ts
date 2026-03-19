"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"

const STORAGE_KEY = "ai-chat-history"
const MAX_MESSAGES = 100 // Limit to prevent localStorage from getting too large

export function useChat() {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load messages from localStorage on initialization
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY)
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(messagesWithDates)
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Keep only the most recent messages to prevent storage overflow
        const messagesToSave = messages.slice(-MAX_MESSAGES)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave))
      } catch (error) {
        console.error("Failed to save chat history:", error)
        toast('please delete some messages or clear history.')
      }
    }
  }, [messages, toast])






  const sendMessage = useCallback(
    async (content: any): Promise<void> => {

      let userMessage: any

      if (!content) {
        return;
      }
      userMessage = Array.isArray(content) ? {
        id: crypto.randomUUID(),
        role: "user",
        content: [...content],
        timestamp: new Date(),
      } : {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const conversationHistory = [...messages, userMessage];
      const recentHistory = conversationHistory.slice(-20);

      const apiMessages = recentHistory.map(({ role, content }) => ({
        role,
        content,
      }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            model: localStorage.getItem("model") || "",
            stream: true,
          }),
        });

        if (!response.ok || !response.body) {
          toast("Something went wrong...");
          return;
        }

        const contentType = response.headers.get("Content-Type") || "";


        console.log("Response Content-Type:", contentType);

        //  if (!contentType.includes("text/plain")) {

        //         const data = await response.json();

        //           const aiMessage: Message = {
        //             id: crypto.randomUUID(),
        //             role: "assistant",
        //             content: data.message,
        //             timestamp: new Date(),
        //             isImage: true,
        //             imageUrl: data.imageUrl,
        //             imagePrompt: data.imagePrompt,
        //           };

        //           setMessages((prev) => [...prev, aiMessage]);

        //         setIsLoading(false);
        //         return;
        //       }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let aiContent = "";

        const aiMessage: any = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let lines = buffer.split("\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace("data:", "").trim();

            if (jsonStr === "[DONE]") {
              buffer = "";
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const contentPiece = parsed.choices?.[0]?.delta?.content;

              if (contentPiece) {
                aiContent += contentPiece;

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIndex = updated.findLastIndex(
                    (m) => m.role === "assistant"
                  );
                  if (lastIndex !== -1) {
                    updated[lastIndex] = {
                      ...updated[lastIndex],
                      content: aiContent,
                    };
                  }
                  return updated;
                });

                await new Promise((r) => setTimeout(r, 10));

              }
            } catch (err) {
              console.error("❌ Stream parse error:", jsonStr, err);
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);
        toast("Oops! Something went wrong. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, toast]
  );



  const clearMessages = useCallback(() => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    toast("All conversation history has been deleted.")
  }, [toast])

  const exportHistory = useCallback(() => {
    try {
      const historyText = messages
        .map((msg) => {
          const timestamp = msg.timestamp.toLocaleString()
          const role = msg.role === "user" ? "You" : "AI Assistant"
          return `[${timestamp}] ${role}: ${msg.content}`
        })
        .join("\n\n")

      const blob = new Blob([historyText], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ai-chat-history-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast("Your conversation history has been downloaded.")
    } catch (error) {
      toast("Unable to export conversation history.")
    }
  }, [messages, toast])

  const getStorageInfo = useCallback(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY)
      const sizeInBytes = savedMessages ? new Blob([savedMessages]).size : 0
      const sizeInKB = Math.round(sizeInBytes / 1024)
      return {
        messageCount: messages.length,
        storageSize: sizeInKB,
        isNearLimit: messages.length > MAX_MESSAGES * 0.8,
      }
    } catch {
      return {
        messageCount: messages.length,
        storageSize: 0,
        isNearLimit: false,
      }
    }
  }, [messages])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    exportHistory,
    getStorageInfo,
  }
}
