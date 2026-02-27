import { useState, forwardRef } from "react";
import { Share2, Mail, MessageSquare, Link, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

interface ShareMenuProps {
  activityName: string;
  activityId: string;
}

export const ShareMenu = forwardRef<HTMLDivElement, ShareMenuProps>(function ShareMenu({ activityName, activityId }, ref) {
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = `${window.location.origin}/activity/${activityId}`;
  const shareText = `Check out ${activityName} on Sydney Planner!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
    setIsOpen(false);
  };

  const handleShareEmail = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(mailtoUrl, "_blank");
    setIsOpen(false);
  };

  const handleShareSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(smsUrl, "_blank");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-xl shadow-lg z-50 w-48 overflow-hidden"
            >
              <div className="p-1">
                <button
                  onClick={handleShareEmail}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </button>
                <button
                  onClick={handleShareSMS}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  SMS
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  <Link className="w-4 h-4 text-muted-foreground" />
                  Copy Link
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});
