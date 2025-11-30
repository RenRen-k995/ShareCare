import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Send } from "lucide-react";
import { getImageUrl } from "../../constants";

export default function ExchangeRequestModal({
  isOpen,
  onClose,
  onConfirm,
  post,
}) {
  // Generate default message based on post
  const getDefaultMessage = () => {
    return `Hi! I'm interested in "${
      post?.title || "this item"
    }". Is it still available?`;
  };

  const [message, setMessage] = useState(getDefaultMessage());

  // Reset message when modal opens with new post
  useEffect(() => {
    if (isOpen && post) {
      setMessage(getDefaultMessage());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.title]); // Only reset when post title changes

  const handleSend = () => {
    // Always ensure we have a message - never send empty
    const defaultMsg = getDefaultMessage();
    const finalMessage = message.trim() || defaultMsg;
    console.log("Sending message:", finalMessage); // Debug log
    onConfirm(finalMessage);
  };

  // Strip HTML tags from description
  const getPlainText = (html) => {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Request Item
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Item Preview */}
          <div className="flex gap-4 p-3 mb-4 border bg-slate-50 rounded-xl border-slate-100">
            <div className="w-16 h-16 overflow-hidden bg-white rounded-lg shrink-0">
              <img
                src={getImageUrl(post?.image)}
                className="object-cover w-full h-full"
                alt={post?.title || ""}
                onError={(e) => {
                  e.target.src = "/vite.svg";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-800 line-clamp-2">
                {post?.title}
              </h4>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                {getPlainText(post?.description)}
              </p>
            </div>
          </div>

          {/* Message Input */}
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Your message to the owner
          </label>
          <Textarea
            placeholder="Hi! I'm interested in this item. When are you available?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="transition-colors resize-none bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
            rows={4}
          />
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="text-white rounded-full bg-emerald-500 hover:bg-emerald-600"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
