import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  MessageSquare,
  AtSign,
  Heart,
  Repeat2,
  SmilePlus,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import { formatTimeAgo } from "../lib/utils";
import { Avatar } from "./common";

const TABS = [
  { id: "all", label: "All", icon: Bell },
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "mentions", label: "@Mentions", icon: AtSign },
  { id: "likes", label: "Likes", icon: Heart },
  { id: "follows", label: "Follows", icon: Repeat2 },
  { id: "reactions", label: "Reactions", icon: SmilePlus },
];

// Mock notifications for demo - Replace with real API
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "like",
    user: { username: "john_doe", avatar: null },
    message: "liked your post",
    postTitle: "Free books for students",
    time: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    read: false,
  },
  {
    id: 2,
    type: "comment",
    user: { username: "jane_smith", avatar: null },
    message: "commented on your post",
    postTitle: "Donating old clothes",
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    read: false,
  },
  {
    id: 3,
    type: "follow",
    user: { username: "mike_wilson", avatar: null },
    message: "started following you",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
  },
  {
    id: 4,
    type: "mention",
    user: { username: "sarah_lee", avatar: null },
    message: "mentioned you in a comment",
    postTitle: "Community help needed",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    read: true,
  },
  {
    id: 5,
    type: "reaction",
    user: { username: "alex_chen", avatar: null },
    message: "reacted ❤️ to your post",
    postTitle: "Free furniture giveaway",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
];

export default function NotificationDropdown({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true;
    if (activeTab === "comments") return notif.type === "comment";
    if (activeTab === "mentions") return notif.type === "mention";
    if (activeTab === "likes") return notif.type === "like";
    if (activeTab === "follows") return notif.type === "follow";
    if (activeTab === "reactions") return notif.type === "reaction";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    // Navigate based on type
    if (notif.type === "follow") {
      navigate(`/user/${notif.user.id || notif.user._id}`);
    } else if (notif.postId) {
      navigate(`/posts/${notif.postId}`);
    }

    onClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-500" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "mention":
        return <AtSign className="w-4 h-4 text-purple-500" />;
      case "follow":
        return <Repeat2 className="w-4 h-4 text-emerald-500" />;
      case "reaction":
        return <SmilePlus className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="p-1.5 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
            title="Mark all as read"
          >
            <CheckCheck className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 transition-colors rounded-lg hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-100 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                !notif.read ? "bg-emerald-50/50" : ""
              }`}
            >
              {/* Avatar with type indicator */}
              <div className="relative shrink-0">
                <Avatar
                  src={notif.user.avatar}
                  fallback={notif.user.username}
                  size="md"
                />
                <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
                  {getNotificationIcon(notif.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{notif.user.username}</span>{" "}
                  {notif.message}
                </p>
                {notif.postTitle && (
                  <p className="text-sm text-gray-500 truncate">
                    "{notif.postTitle}"
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {formatTimeAgo(notif.time)}
                </p>
              </div>

              {/* Unread indicator */}
              {!notif.read && (
                <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
              )}
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredNotifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100">
          <button className="w-full py-2 text-sm font-medium text-center text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
