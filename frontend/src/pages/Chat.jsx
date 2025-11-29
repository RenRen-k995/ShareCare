import { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import chatService from "../services/chatService";
import MainLayout from "../components/layout/MainLayout";

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const response = await chatService.getUserChats();
      setChats(response.chats || []);
      return response.chats || [];
    } catch (error) {
      console.error("Error loading chats:", error);
      return [];
    }
  };

  // Xử lý logic mở chat (từ URL hoặc từ nút Contact hoặc auto-open)
  useEffect(() => {
    const initChat = async () => {
      // Trường hợp 1: Bấm nút "Contact" từ bài đăng (có userId trong state)
      if (location.state?.userId) {
        try {
          setLoading(true);
          const { userId, postId } = location.state;

          // Gọi API lấy hoặc tạo phòng chat mới
          const data = await chatService.getOrCreateChat(userId, postId);

          if (data.chat) {
            setSelectedChat(data.chat);
            setShowChatWindow(true);
          }

          // Xóa state để tránh lặp lại khi refresh
          navigate(location.pathname, { replace: true, state: null });
        } catch (error) {
          console.error("Failed to initialize chat:", error);
        } finally {
          setLoading(false);
        }
      }
      // Trường hợp 2: Có chatId trên URL (ví dụ share link)
      else if (searchParams.get("chatId")) {
        const chatId = searchParams.get("chatId");
        loadChatById(chatId);
      }
      // Trường hợp 3: Không có gì → Auto-open latest chat
      else if (chats.length > 0 && !selectedChat) {
        // Sort by updatedAt and select the latest
        const sortedChats = [...chats].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        if (sortedChats[0]) {
          setSelectedChat(sortedChats[0]);
          setShowChatWindow(true);
        }
      }
    };

    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.userId, searchParams, chats.length]);

  const loadChatById = async (chatId) => {
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
    setSelectedChat(null);
  };

  const handleChatUpdate = (updatedChats) => {
    setChats(updatedChats);
  };

  return (
    // 1. Ẩn RightSidebar để chat full màn hình
    <MainLayout rightSidebar={null}>
      {/* 2. Container chính: Absolute positioning to break out of scroll context */}
      <div className="absolute inset-0 flex flex-col px-0 md:px-6 pb-6 pt-6">
        {/* 3. Khung Chat: Bo góc lớn (rounded-[2rem]), viền mỏng, bóng nhẹ */}
        <div className="flex-1 min-h-0 flex flex-col bg-white md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid h-full grid-cols-1 lg:grid-cols-3">
            {/* --- Danh sách Chat (Bên trái) --- */}
            <div
              className={`lg:col-span-1 border-r border-gray-100 h-full flex flex-col overflow-hidden ${
                showChatWindow ? "hidden lg:flex" : "flex"
              }`}
            >
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChat?._id}
                onChatsUpdate={handleChatUpdate}
              />
            </div>

            {/* --- Cửa sổ Chat (Bên phải) --- */}
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
