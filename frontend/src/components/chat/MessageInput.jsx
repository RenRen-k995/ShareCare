import { useState, useRef, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import {
  Plus,
  Send,
  Smile,
  X,
  Image as ImageIcon,
  Loader2,
  Paperclip,
} from "lucide-react";
import { Button } from "../ui/button";

const EMOJI_LIST = ["👍", "❤️", "😊", "😂", "🎉", "👏", "🔥", "✨", "😭", "👀"];

export default function MessageInput({ chatId, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { sendMessage, sendTypingStart, sendTypingStop } = useSocket();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Auto-resize textarea with max height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120); // Max 120px
      textareaRef.current.style.height = newHeight + "px";
    }
  }, [message]);

  // Xử lý Typing Indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);
    sendTypingStart(chatId);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Stop typing sau 2s không gõ
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(chatId);
    }, 2000);
  };

  // Xử lý chọn file
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File quá lớn! Vui lòng chọn file dưới 10MB.");
      return;
    }

    setSelectedFile(file);

    // Tạo preview local (chỉ để người gửi xem trước khi gửi)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload file lên Server (Quan trọng: Để người khác thấy được)
  const uploadFileToServer = async (file) => {
    const formData = new FormData();
    formData.append("file", file); // Tên field phải khớp với multer ở backend

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/chat/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Upload failed");
    }
    return await res.json(); // Trả về { fileUrl: "cloudinary URL", ... }
  };

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    setUploading(true);
    sendTypingStop(chatId);

    try {
      let messageData = {
        chatId,
        content: message.trim(),
        messageType: "text",
      };

      // Nếu có file, upload trước
      if (selectedFile) {
        const uploadData = await uploadFileToServer(selectedFile);

        messageData.messageType = selectedFile.type.startsWith("image/")
          ? "image"
          : "file";
        messageData.fileUrl = uploadData.fileUrl; // Đường dẫn tương đối từ server
        messageData.fileName = selectedFile.name;
        messageData.fileSize = selectedFile.size;
      }

      // Gửi thông tin qua Socket (đã bao gồm URL từ server)
      sendMessage(messageData);

      // Reset
      setMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      removeFile();
      setShowEmojiPicker(false);
      onMessageSent?.();
    } catch (error) {
      console.error("Send error:", error);
      alert("Gửi tin nhắn thất bại.");
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col p-3 bg-white border-t">
      {/* File Preview Area */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-2 mb-2 border bg-slate-50 rounded-xl border-slate-100">
          {filePreview ? (
            <img
              src={filePreview}
              alt="Preview"
              className="object-cover w-12 h-12 border rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-200">
              <Paperclip className="w-5 h-5 text-slate-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-700">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={removeFile}
            className="p-1 rounded-full hover:bg-slate-200"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* Emoji Bar */}
      {showEmojiPicker && (
        <div className="flex gap-2 p-2 mb-2 overflow-x-auto bg-slate-50 rounded-xl no-scrollbar">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setMessage((prev) => prev + emoji)}
              className="px-1 text-xl transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Row - Messenger Style */}
      <div className="flex items-end gap-2">
        {/* Plus Button with Popup Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full flex-shrink-0 ${
              showAttachMenu
                ? "text-emerald-500 bg-emerald-50"
                : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
            }`}
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={uploading}
          >
            <Plus className="w-5 h-5" />
          </Button>

          {/* Attachment Menu Popup */}
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-100 p-2 min-w-[160px]">
              <input
                ref={imageInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
              />
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-left transition-colors rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-slate-700">Image</span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-left transition-colors rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                  <Paperclip className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium text-slate-700">File</span>
              </button>
            </div>
          )}
        </div>

        {/* Text Input with Inside Buttons */}
        <div className="flex-1 relative flex items-end bg-slate-50 rounded-[1.2rem] px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            placeholder="Aa"
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-700 placeholder:text-gray-400 max-h-[120px] py-1 pr-2"
            rows={1}
            disabled={uploading}
            style={{ minHeight: "24px" }}
          />
          <Button
            variant="ghost"
            size="icon"
            className={`flex-shrink-0 h-6 w-6 rounded-full ${
              showEmojiPicker
                ? "text-yellow-500 bg-yellow-50"
                : "text-slate-400 hover:text-yellow-500 hover:bg-transparent"
            }`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={uploading}
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || uploading}
          className="flex-shrink-0 w-10 h-10 text-white rounded-full shadow-md bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-10 h-10" />
          )}
        </Button>
      </div>
    </div>
  );
}
