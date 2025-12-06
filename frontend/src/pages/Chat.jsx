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
    // Hide global right sidebar to give Chat full space
    <MainLayout rightSidebar={null}>
      <div className="absolute inset-0 flex flex-col px-2 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6 bg-gray-100">
        {/* Main Chat Container - Grid with gap between panels */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* --- Left: Chat List Panel --- */}
          <div
            className={`lg:col-span-4 xl:col-span-3 h-full flex flex-col overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 ${
              showChatWindow ? "hidden lg:flex" : "flex"
            }`}
          >
            <ChatList
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChat?._id}
            />
          </div>

          {/* --- Right: Chat Window Panel --- */}
          <div
            className={`lg:col-span-8 xl:col-span-9 h-full overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 ${
              showChatWindow ? "flex flex-col" : "hidden lg:flex flex-col"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full bg-gray-50/50">
                <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-emerald-500"></div>
              </div>
            ) : (
              <ChatWindow chat={selectedChat} onBack={handleBack} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
