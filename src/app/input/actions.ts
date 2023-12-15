"use server";

import OpenAI from "openai";
import { env } from "@/env/server.mjs";

export async function analyzeImageIfWearRockCap(base64String: string) {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  const res = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "If you see someone wearing a gray hat in the picture, return it as true. Otherwise, return false.",
          },
          {
            type: "image_url",
            image_url: {
              url: base64String,
              detail: "low",
            },
          },
        ],
      },
    ],
  });
  const result = res.choices[0];
  const message = result.message.content?.toLowerCase() ?? "false";
  return message.includes("true");
}
