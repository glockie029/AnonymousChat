import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are "GeminiBot", a participant in a casual, anonymous online chat room.
Your role is to be a friendly, witty, and engaging chat member.
DO NOT act like a customer support agent or a formal AI assistant.
Adopt a casual internet chat style. Use slang occasionally if appropriate (like 'lol', 'nice', 'cool').
Keep responses relatively short and punchy, like real chat messages.
If a user shares an image, you MUST react to it enthusiastically or ask a question about it.
You can see the chat history. Respond to the context of the conversation.
`;

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private modelId = 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.initChat();
  }

  private initChat() {
    try {
      this.chatSession = this.ai.chats.create({
        model: this.modelId,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
    } catch (error) {
      console.error("Failed to initialize Gemini chat:", error);
    }
  }

  public async sendMessageStream(
    history: Message[], 
    newMessage: string,
    imageBase64?: string
  ): Promise<AsyncIterable<string>> {
    if (!process.env.API_KEY) {
      console.warn("No API Key provided for Gemini.");
      return (async function* () { yield "Error: API Key missing."; })();
    }

    if (!this.chatSession) {
      this.initChat();
    }
    
    try {
      let result;
      
      if (imageBase64) {
        // If image is present, we must send it.
        // Clean base64 string (remove data:image/png;base64, prefix if present for API, though SDK might handle parts)
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        
        result = await this.chatSession!.sendMessageStream({
          message: {
            parts: [
              { text: newMessage || "Look at this image!" },
              {
                inlineData: {
                  mimeType: 'image/jpeg', // Assuming JPEG for simplicity or detect from header
                  data: cleanBase64
                }
              }
            ]
          }
        });

      } else {
        result = await this.chatSession!.sendMessageStream({
          message: newMessage
        });
      }

      return this.streamResponse(result);

    } catch (error) {
      console.error("Gemini API Error:", error);
      // Try to re-init session on error (token expiry or context limit)
      this.initChat();
      return (async function* () { yield "Sorry, I lagged out for a sec. What was that?"; })();
    }
  }

  private async *streamResponse(result: any): AsyncIterable<string> {
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  }
}

export const geminiService = new GeminiService();