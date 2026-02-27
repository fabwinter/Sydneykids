import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.warn("[useIsAdmin] query error:", error.message);
        return false;
      }
      return !!data;
    },
    enabled: !!user,
    staleTime: 0,           // Always re-check on mount — admin status is security-critical
    gcTime: 1000 * 60 * 5,  // Keep in GC cache for 5 min so re-renders don't re-fetch
  });

  return isAdmin;
}
