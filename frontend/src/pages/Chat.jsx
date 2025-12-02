import { useState, useEffect, useRef } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import chatService from "../services/chatService";
import MainLayout from "../components/layout/MainLayout";

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [loading, setLoading] = useState(false);

  // We don't need to manage 'chats' state here as ChatList handles it internally
  // We only need to trigger updates or selection

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const hasInitialized = useRef(false);

  // Handle chat initialization from navigation or URL
  useEffect(() => {
    const initChat = async () => {
      // Case 1: Contact button navigation with userId
      if (location.state?.userId && !hasInitialized.current) {
        hasInitialized.current = true;

        try {
          setLoading(true);
          const { userId, postId } = location.state;
          const data = await chatService.getOrCreateChat(userId, postId);

          if (data.chat) {
            setSelectedChat(data.chat);
            setShowChatWindow(true);
          }

          // Clear state to prevent re-initialization
          navigate(location.pathname, { replace: true, state: null });
        } catch (error) {
          console.error("Failed to initialize chat:", error);
        } finally {
          setLoading(false);
        }
      }
      // Case 2: Direct chat link with chatId parameter (includes refresh parameter)
      else if (searchParams.get("chatId")) {
        // Always reload if chatId is different OR if refresh param is present
        const chatId = searchParams.get("chatId");
        if (selectedChat?._id !== chatId || searchParams.get("refresh")) {
          loadChatById(chatId);
        }
      }
    };

    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, searchParams]);

  const loadChatById = async (chatId) => {
    try {
      // We can fetch a single chat or find it in the list
      // For simplicity/performance, let's fetch the list and find it
      // Or ideally, have an API to get single chat by ID
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
    setSelectedChat(null);
  };

  return (
    <MainLayout rightSidebar={null}>
      <div className="absolute inset-0 flex flex-col px-0 pt-6 pb-6 md:px-6">
        {/* Main Chat Container */}
        <div className="flex-1 min-h-0 flex flex-col neu-card md:rounded-3xl overflow-hidden">
          <div className="grid h-full grid-cols-1 lg:grid-cols-3">
            {/* Left: Chat List */}
            <div
              className={`lg:col-span-1 border-r border-gray-100 h-full flex flex-col overflow-hidden ${
                showChatWindow ? "hidden lg:flex" : "flex"
              }`}
            >
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChat?._id}
              />
            </div>

            {/* Right: Chat Window */}
            <div
              className={`lg:col-span-2 h-full bg-white overflow-hidden ${
                showChatWindow ? "flex flex-col" : "hidden lg:flex flex-col"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full bg-gray-50/50">
                  <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-500"></div>
                </div>
              ) : (
                <ChatWindow chat={selectedChat} onBack={handleBack} />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
