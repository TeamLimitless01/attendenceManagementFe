import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.AI_API_TOKEN_POLLINATIONS;

    if (!apiKey) {
      return NextResponse.json({ error: 'Sarvam API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are the AMS (Attendance Management System) Assistant. You are a professional, helpful, and sleek AI representative for AMS. 

AMS Features:
- AI-Powered Facial Recognition: Users can register their faces and verify them for instant attendance.
- Precision Geo-fencing: Restricts attendance logging to authorized GPS coordinates.
- Integrated LMS: A complete Learning Management System to manage subjects, class schedules, and student enrollments.
- Multi-role Support: Specialized portals for Administrators, Teachers, and Students.
- Real-time Analytics: Dynamic dashboards with visualization of attendance trends and participation metrics.
- Modern UI: High-performance, animated interface built with Next.js, Tailwind CSS, and Framer Motion.

Your Goal: 
Help users navigate AMS, explain its features, and provide professional consultation on how to best use the system for their institutions or teams. Keep your tone premium, clear, and supportive.`
          },
          ...messages
        ],
        model: 'openai-fast',
        stream: true, // Enable streaming
      }),
    });

    // Pass the stream directly back to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Sarvam API Error:', error);
    return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
