import { useState, useRef, useEffect } from "react";
import { useSocket } from "../../contexts/SocketContext";
import {
  Send,
  Smile,
  X,
  Image as ImageIcon,
  Loader2,
  Paperclip,
} from "lucide-react";
import { Button } from "../ui/button";
import { compressImage } from "../../utils/imageCompression";

const EMOJI_LIST = ["👍", "❤️", "😊", "😂", "🎉", "👏", "🔥", "✨", "😭", "👀"];

export default function MessageInput({ chatId, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); // For showing compression/upload status

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
    console.log("File select triggered", e.target.files);
    const file = e.target.files[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name, file.type, file.size);

    if (file.size > 10 * 1024 * 1024) {
      alert("File quá lớn! Vui lòng chọn file dưới 10MB.");
      e.target.value = ""; // Reset input
      return;
    }

    setSelectedFile(file);
    console.log("File set to state:", file.name);

    // Tạo preview local (chỉ để người gửi xem trước khi gửi)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("Image preview created");
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("Non-image file, no preview");
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Upload file lên Server
  const uploadFileToServer = async (file) => {
    const formData = new FormData();

    // Compress images before upload for faster upload speed
    if (file.type.startsWith("image/")) {
      try {
        setUploadStatus("Compressing image...");
        console.log("Compressing image before upload...");
        const compressedBase64 = await compressImage(file, 1200, 0.8); // Max 1200px width, 80% quality

        // Convert base64 to blob
        const response = await fetch(compressedBase64);
        const blob = await response.blob();
        const compressedFile = new File([blob], file.name, {
          type: "image/jpeg",
        });

        console.log(
          `Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(
            compressedFile.size / 1024
          ).toFixed(1)}KB`
        );
        formData.append("file", compressedFile);
      } catch (error) {
        console.warn("Compression failed, uploading original:", error);
        formData.append("file", file);
      }
    } else {
      formData.append("file", file);
    }

    setUploadStatus("Uploading...");
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
        console.log("Uploading file:", selectedFile.name, selectedFile.type);
        const uploadData = await uploadFileToServer(selectedFile);
        console.log("Upload response:", uploadData);

        messageData.messageType = selectedFile.type.startsWith("image/")
          ? "image"
          : "file";
        messageData.fileUrl = uploadData.fileUrl;
        messageData.fileName = uploadData.fileName || selectedFile.name;
        messageData.fileSize = uploadData.fileSize || selectedFile.size;
      }

      console.log("Sending message via socket:", messageData);
      sendMessage(messageData);

      // Reset
      setMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      removeFile();
      setShowEmojiPicker(false);
      setUploadStatus("");
      onMessageSent?.();
    } catch (error) {
      console.error("Send error:", error);
      alert(`Gửi tin nhắn thất bại: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col p-4 bg-white">
      {/* File Preview Area */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-3 mb-3 border bg-gray-50 rounded-xl border-gray-200">
          {filePreview ? (
            <img
              src={filePreview}
              alt="Preview"
              className="object-cover w-14 h-14 border rounded-lg"
            />
          ) : (
            <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gray-200">
              <Paperclip className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-700">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-400">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={removeFile}
            className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Emoji Bar */}
      {showEmojiPicker && (
        <div className="flex gap-2 p-3 mb-3 overflow-x-auto bg-gray-50 rounded-xl no-scrollbar border border-gray-100">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setMessage((prev) => prev + emoji)}
              className="px-1 text-2xl transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
      />

      {/* Main Input Row */}
      <div className="flex items-end gap-3">
        {/* Attachment Button with Popup Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full flex-shrink-0 h-10 w-10 ${
              showAttachMenu
                ? "text-emerald-500 bg-emerald-50"
                : "text-gray-500 hover:text-emerald-500 hover:bg-emerald-50"
            }`}
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={uploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Attachment Menu Popup */}
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 min-w-[180px] z-50">
              <button
                type="button"
                onClick={() => {
                  console.log("Image button clicked");
                  imageInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex items-center w-full gap-3 px-3 py-2.5 text-sm text-left transition-colors rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-blue-100 rounded-full">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("File button clicked");
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="flex items-center w-full gap-3 px-3 py-2.5 text-sm text-left transition-colors rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-purple-100 rounded-full">
                  <Paperclip className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">File</span>
              </button>
            </div>
          )}
        </div>

        {/* Text Input with Emoji Button */}
        <div className="flex-1 relative flex items-end bg-gray-100 rounded-2xl px-4 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-200 focus-within:border-emerald-300 transition-all border border-transparent">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none resize-none text-base text-gray-700 placeholder:text-gray-400 max-h-[120px] py-0.5 pr-2"
            rows={1}
            disabled={uploading}
            style={{ minHeight: "28px" }}
          />
          <Button
            variant="ghost"
            size="icon"
            className={`flex-shrink-0 h-7 w-7 rounded-full ${
              showEmojiPicker
                ? "text-yellow-500 bg-yellow-50"
                : "text-gray-400 hover:text-yellow-500 hover:bg-transparent"
            }`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={uploading}
          >
            <Smile className="w-5 h-5" />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || uploading}
          className="flex-shrink-0 w-11 h-11 text-white rounded-full shadow-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:bg-gray-300"
          title={uploadStatus || "Send message"}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Upload Status Indicator */}
      {uploading && uploadStatus && (
        <div className="mt-2 text-sm text-center text-gray-500 animate-pulse">
          {uploadStatus}
        </div>
      )}
    </div>
  );
}
