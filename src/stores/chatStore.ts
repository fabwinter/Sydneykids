import { create } from "zustand";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

interface ChatStore {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  setMessages: (messagesOrFn) =>
    set((state) => ({
      messages:
        typeof messagesOrFn === "function"
          ? messagesOrFn(state.messages)
          : messagesOrFn,
    })),
  clearMessages: () => set({ messages: [] }),
}));
