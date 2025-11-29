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

  // 1. Add a Ref to track initialization status
  // This prevents double-firing in React Strict Mode
  const initializingRef = useRef(false);

  // Handle chat initialization (from URL or Contact button)
  useEffect(() => {
    const initChat = async () => {
      // Case 1: "Contact" button clicked (userId passed in navigation state)
      if (location.state?.userId) {
        // STOP if already initializing to prevent double API calls
        if (initializingRef.current) return;
        initializingRef.current = true;

        try {
          setLoading(true);
          const { userId, postId } = location.state;

          // API call to Find or Create Chat
          const data = await chatService.getOrCreateChat(userId, postId);

          if (data.chat) {
            setSelectedChat(data.chat);
            setShowChatWindow(true);
          }

          // Clear navigation state immediately so this doesn't run again on refresh
          // Use replace: true to replace the current history entry
          navigate(location.pathname, { replace: true, state: null });
        } catch (error) {
          console.error("Failed to initialize chat:", error);
        } finally {
          setLoading(false);
          // Optional: reset ref after a delay if needed, but usually not for this flow
          setTimeout(() => {
            initializingRef.current = false;
          }, 1000);
        }
      }
      // Case 2: chatId in URL param (e.g. shared link /chat?chatId=123)
      else if (searchParams.get("chatId")) {
        const chatId = searchParams.get("chatId");
        // Only load if not already selected
        if (selectedChat?._id !== chatId) {
          loadChatById(chatId);
        }
      }
    };

    initChat();
  }, [location.state, searchParams, navigate, selectedChat]); // Removed unstable dependencies

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
      <div className="absolute inset-0 flex flex-col px-0 pt-6 pb-6 md:px-6">
        {/* Main Chat Container */}
        <div className="flex-1 min-h-0 flex flex-col bg-white md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid h-full grid-cols-1 lg:grid-cols-3">
            {/* --- Left: Chat List --- */}
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

            {/* --- Right: Chat Window --- */}
            <div
              className={`lg:col-span-2 h-full bg-white overflow-hidden ${
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
      </div>
    </MainLayout>
  );
}
