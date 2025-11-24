import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import chatService from "../services/chatService";
import MainLayout from "../components/layout/MainLayout";

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chatId) {
      loadChat(chatId);
    }
    // Check if navigated from PostCard with userId
    if (location.state?.userId) {
      // Could create or find existing chat with this user
      console.log("Starting chat with user:", location.state.userId);
    }
  }, [searchParams, location.state]);

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
    <MainLayout>
      <div className="h-full flex flex-col px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Chat List */}
            <div
              className={`lg:col-span-1 border-r border-gray-100 ${
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
    </MainLayout>
  );
}
