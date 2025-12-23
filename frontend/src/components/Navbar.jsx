import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { Button } from "./ui/button";
import { Heart, LogOut, User, MessageSquare, Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { socket, connected, getTotalUnreadCount } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2); // Mock count
  const navigate = useNavigate();

  useEffect(() => {
    if (socket && connected && user) {
      // Get initial unread count
      getTotalUnreadCount();

      // Listen for unread count updates
      socket.on("chat:total_unread", ({ count }) => {
        setUnreadCount(count);
      });

      socket.on("message:receive", () => {
        // Refresh unread count when new message arrives
        getTotalUnreadCount();
      });

      socket.on("chat:unread_cleared", () => {
        // Refresh unread count when chat is read
        getTotalUnreadCount();
      });

      return () => {
        socket.off("chat:total_unread");
        socket.off("message:receive");
        socket.off("chat:unread_cleared");
      };
    }
  }, [socket, connected, user, getTotalUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="size-8 text-emerald-600" />
            <span className="text-2xl font-bold text-gray-900">ShareCare</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-700">Hello, {user.username}</span>

                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="size-4" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-bold">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </Button>
                  <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>

                <Link to="/chat">
                  <Button variant="ghost" size="sm" className="relative">
                    <MessageSquare className="size-4 mr-2" />
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="size-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
