import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import ReactMarkdown from "react-markdown";
import { ChatVenueCards } from "@/components/chat/ChatVenueCards";

const starterPrompts = [
  "Quiet cafe with WiFi",
  "Family-friendly activities",
  "Best views in Sydney",
  "Hidden gems near me",
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const { profile, isAuthenticated } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const firstName = profile?.name?.split(" ")[0];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setInput("");
    sendMessage(text);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fab pulse-glow"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-20 md:right-4 md:left-auto md:w-96 bg-card rounded-2xl shadow-elevated border border-border z-50 flex flex-col max-h-[70vh] slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Sydney Planner Assistant</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              G'day{isAuthenticated && firstName ? ` ${firstName}` : ""}! 👋 I can help you discover amazing places in Sydney. Try asking:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-2 bg-muted hover:bg-primary/10 hover:text-primary rounded-full text-xs font-medium transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, msgIndex) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {/* Venue cards */}
                {message.role === "assistant" && message.content.length > 20 && (
                  <ChatVenueCards messageContent={message.content} />
                )}
                {/* Quick reply buttons */}
                {message.role === "assistant" && (message as any).quickReplies?.length > 0 && msgIndex === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                    {(message as any).quickReplies.map((reply: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleSend(reply)}
                        className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-[11px] font-medium transition-colors border border-primary/20"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you're looking for..."
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full w-10 h-10 bg-primary hover:bg-primary/90"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
