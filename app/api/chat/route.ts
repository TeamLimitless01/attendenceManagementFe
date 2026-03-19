
const systemPrompt = `You are a helpful assistant.`
export async function POST(req: Request) {
    try {
        const { messages, model, stream: isStream, personality, provider } = await req.json();
        // const lastMessage = messages[messages.length - 1]?.content || "";

        console.log("Received messages:", personality, model, provider);

        // const imageKeywords = [
        //   "generate image",
        //   "create image",
        //   "make image",
        //   "draw",
        //   "picture of",
        //   "image of",
        //   "show me",
        //   "visualize",
        //   "illustration",
        //   "artwork",
        //   "photo of",
        // ];

        // const isImageRequest = imageKeywords.some((keyword) =>
        //   lastMessage.toLowerCase().includes(keyword)
        // );

        // if (isImageRequest) {
        //   let imagePrompt = lastMessage
        //     .replace(
        //       /generate image of|create image of|make image of|draw|picture of|image of|show me|visualize|illustration of|artwork of|photo of/gi,
        //       ""
        //     )
        //     .trim();

        //   if (!imagePrompt) {
        //     imagePrompt = lastMessage;
        //   }

        //   console.log("Image request detected:", imagePrompt);

        //   const encodedPrompt = encodeURIComponent(imagePrompt);
        //   const randomSeed = Math.floor(Math.random() * 100);
        //   const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?enhance=true&nologo=true&model=kontext&seed=${randomSeed}&token=${process.env.AI_API_TOKEN}&referer=${process.env.SITE_BASE_URL}`;

        //   return Response.json({
        //     message: `🎨 **Image Generated Successfully!**\n\n![Generated Image](${imageUrl})\n\n**Prompt:** ${imagePrompt}\n\n*AI has visualized your request! ✨*`,
        //     isImage: true,
        //     imageUrl: imageUrl,
        //     imagePrompt: imagePrompt,
        //   });
        // }

        // Prepare streaming request to pollinations.ai
        // https://text.pollinations.ai/openai

        const API_URI = "https://gen.pollinations.ai/v1/chat/completions"

        // console.log(typeof API_URI)

        const upstreamResponse = await fetch(API_URI, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.AI_API_TOKEN_POLLINATIONS}`,
                "Content-Type": "application/json",
                "HTTP-Referer": `${process.env.SITE_BASE_URL}`,
                "X-Title": "VOID AI",
            },
            body: JSON.stringify({
                model: model || "openai",
                stream: isStream || false,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt || "void",
                    },
                    ...messages

                ],
            }),
        });

        if (!upstreamResponse.ok || !upstreamResponse.body) {
            console.log(upstreamResponse)
            return new Response("Upstream failed", { status: 502 });
        }



        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const reader = upstreamResponse.body!.getReader();
                const decoder = new TextDecoder("utf-8");

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const textChunk = decoder.decode(value);
                    controller.enqueue(encoder.encode(textChunk));
                }

                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("API Error:", error);
        return Response.json(
            { error: "Ohh there's something wrong, try again!" },
            { status: 500 }
        );
    }
}
