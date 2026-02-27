import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Trash2, Plus, MessageSquare, ChevronLeft, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { useChatSessions } from "@/hooks/useChatSessions";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/stores/chatStore";
import ReactMarkdown from "react-markdown";
import { ChatVenueCards } from "@/components/chat/ChatVenueCards";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const starterPrompts = [
  "🍳 Best brunch spots nearby",
  "🏖️ Family-friendly beaches",
  "🌃 Romantic dinner ideas",
  "🎨 Hidden gems to explore",
  "☕ Quiet cafes for work",
  "🌿 Nature walks in Sydney",
];

export default function Chat() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const { sessions, createSession, deleteSession, updateSessionTitle, loadSessionMessages, saveMessage } = useChatSessions();
  const { profile, isAuthenticated } = useAuth();
  const { setMessages } = useChatStore();
  const [input, setInput] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(0);

  const firstName = profile?.name?.split(" ")[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-save messages to session
  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (messages.length > prevMessagesLength.current && lastMsg && !isLoading) {
      saveMessage(activeSessionId, lastMsg.role, lastMsg.content);
      // Update session title from first user message
      if (messages.length <= 2 && lastMsg.role === "user") {
        const title = lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? "..." : "");
        updateSessionTitle.mutate({ sessionId: activeSessionId, title });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isLoading, activeSessionId]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    // Create session on first message if none active
    if (!activeSessionId && profile?.id) {
      try {
        const session = await createSession.mutateAsync(text.slice(0, 50));
        setActiveSessionId(session.id);
      } catch (e) {
        console.error("Failed to create session", e);
      }
    }
    setInput("");
    sendMessage(text);
  }, [activeSessionId, profile?.id, createSession, sendMessage]);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    clearMessages();
    prevMessagesLength.current = 0;
    setShowHistory(false);
  }, [clearMessages]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      const msgs = await loadSessionMessages(sessionId);
      setMessages(msgs);
      setActiveSessionId(sessionId);
      prevMessagesLength.current = msgs.length;
      setShowHistory(false);
    } catch (e) {
      console.error("Failed to load session", e);
    }
  }, [loadSessionMessages, setMessages]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession.mutateAsync(sessionId);
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  }, [deleteSession, activeSessionId, handleNewChat]);

  // Chat history sidebar content
  const historySidebar = (
    <div className="flex flex-col h-full border-r border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Chat History</h2>
        <Button variant="ghost" size="icon" onClick={handleNewChat} title="New chat">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">No previous chats</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeSessionId === s.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
                onClick={() => handleLoadSession(s.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(s.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(s.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Main chat panel
  const chatPanel = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Show history toggle on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? <ChevronLeft className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">Sydney Planner Assistant</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs text-muted-foreground">Powered by AI</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5 text-muted-foreground" title="New chat">
              <Plus className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">New</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showHistory ? (
          // Mobile history view
          <div className="space-y-1">
            <Button variant="outline" className="w-full mb-3 gap-2" onClick={handleNewChat}>
              <Plus className="w-4 h-4" /> New Chat
            </Button>
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-2 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                  activeSessionId === s.id ? "bg-primary/10" : "hover:bg-muted"
                }`}
                onClick={() => handleLoadSession(s.id)}
              >
                <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id); }}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold">
                G'day{isAuthenticated && firstName ? ` ${firstName}` : ""}! 👋
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                I'm your Sydney Planner assistant. Tell me what you're in the mood for, and I'll find the perfect spots!
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
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
                <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  }`}>
                    {message.role === "assistant" ? (
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {message.role === "assistant" && message.content.length > 20 && (
                  <ChatVenueCards messageContent={message.content} />
                )}
                {message.role === "assistant" && (message as any).quickReplies?.length > 0 && msgIndex === messages.length - 1 && !isLoading && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                    {(message as any).quickReplies.map((reply: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => handleSend(reply)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-medium transition-colors border border-primary/20"
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
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Input - hide when showing mobile history */}
      {!showHistory && (
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about Sydney..."
              className="flex-1 bg-muted rounded-full px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full w-11 h-11 bg-primary hover:bg-primary/90 shrink-0"
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout>
      {/* Mobile: single column | Desktop: sidebar + chat */}
      <div className="h-[calc(100vh-8rem)] max-w-lg md:max-w-none mx-auto md:mx-0 flex">
        {/* History sidebar - desktop only */}
        <div className="hidden md:block w-72 shrink-0">
          {historySidebar}
        </div>
        {/* Chat panel */}
        <div className="flex-1 min-w-0">
          {chatPanel}
        </div>
      </div>
    </AppLayout>
  );
}
