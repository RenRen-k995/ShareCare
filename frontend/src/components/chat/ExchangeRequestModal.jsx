import { useState } from "react";
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

export default function ExchangeRequestModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    onConfirm(message); // Logic to create chat & exchange
    setMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md rounded-2xl">
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
                src={item?.image}
                className="object-cover w-full h-full"
                alt=""
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">{item?.title}</h4>
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                {item?.description}
              </p>
            </div>
          </div>

          {/* Message Input */}
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Add a message to the owner (Optional)
          </label>
          <Textarea
            placeholder="Hi! I'm interested in this item. When are you available?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="transition-colors resize-none bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
            rows={3}
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
