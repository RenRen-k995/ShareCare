import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import chatService from "../services/chatService";
import Navbar from "../components/Navbar";

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chatId) {
      loadChat(chatId);
    }
  }, [searchParams]);

  const loadChat = async (chatId) => {
    try {
      const response = await chatService.getUserChats();
      const chat = response.chats?.find((c) => c._id === chatId);
      if (chat) {
        setSelectedChat(chat);
        setShowChatWindow(true);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowChatWindow(true);
  };

  const handleBack = () => {
    setShowChatWindow(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Chat List */}
            <div
              className={`lg:col-span-1 ${
                showChatWindow ? "hidden lg:block" : "block"
              }`}
            >
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChat?._id}
              />
            </div>

            {/* Chat Window */}
            <div
              className={`lg:col-span-2 ${
                showChatWindow ? "block" : "hidden lg:block"
              }`}
            >
              <ChatWindow chat={selectedChat} onBack={handleBack} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
