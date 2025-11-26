import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are a participant in a casual, anonymous online chat room. 
Your name is "GeminiBot".
Your tone should be friendly, informal, and concise, fitting for a chat room environment.
You can see the chat history. Respond naturally to the last message or the general conversation context.
If the user uploads an image, describe it briefly or react to it.
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

    // Prepare message content. 
    // In a real chat loop, we might want to feed previous history context properly.
    // For this simple demo, we rely on the Chat session memory, but sending images requires careful handling.
    // We will just send the current user message to the session.
    
    try {
      let result;
      
      if (imageBase64) {
        // If image is present, we must send it.
        // Clean base64 string (remove data:image/png;base64, prefix if present for API, though SDK might handle parts)
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
        
        result = await this.chatSession!.sendMessageStream({
          message: {
            parts: [
              { text: newMessage || "What do you think of this?" },
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
      return (async function* () { yield "Sorry, I lost connection to the matrix."; })();
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