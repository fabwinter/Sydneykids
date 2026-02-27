import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatSessions() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["chat-sessions", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as ChatSession[];
    },
    enabled: !!profile?.id,
  });

  const createSession = useMutation({
    mutationFn: async (title?: string) => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: profile!.id, title: title || "New Chat" })
        .select()
        .single();
      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });

  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });

  const updateSessionTitle = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({ title })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat-sessions"] }),
  });

  const loadSessionMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map((m) => ({
      id: m.id,
      role: m.message_type as "user" | "assistant",
      content: m.content,
      timestamp: new Date(m.created_at),
    }));
  };

  const saveMessage = async (sessionId: string, role: "user" | "assistant", content: string) => {
    if (!profile?.id) return;
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      user_id: profile.id,
      message_type: role,
      content,
    });
  };

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    createSession,
    deleteSession,
    updateSessionTitle,
    loadSessionMessages,
    saveMessage,
  };
}
