import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  BookOpen,
  Heart,
  MessageSquare,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const categories = [
    { name: "Home", href: "/", icon: Home, label: "All Posts" },
    {
      name: "Items",
      href: "/?category=items",
      icon: Package,
      label: "Donations",
    },
    {
      name: "Knowledge",
      href: "/?category=knowledge",
      icon: BookOpen,
      label: "Info Sharing",
    },
    {
      name: "Support",
      href: "/?category=emotional-support",
      icon: Heart,
      label: "Emotional Support",
    },
  ];

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/" && !location.search;
    if (href === "/chat") return location.pathname === "/chat";
    return location.pathname + location.search === href;
  };

  return (
    <aside className="flex-col hidden bg-white md:flex w-[19.3rem]">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 bg-emerald-600 rounded-xl">
            <Heart className="text-white size-6" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold text-gray-900">ShareCare</span>
        </Link>
      </div>

      {/* Categories Section */}
      <nav className="flex-1 px-4">
        <p className="px-4 mb-2 text-base font-semibold tracking-wider text-gray-400 uppercase">
          Categories
        </p>
        <div className="space-y-1">
          {categories.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`size-5 mr-3 ${active ? "text-emerald-600" : ""}`}
                />
                <div className="flex flex-col">
                  <span className="text-base">{item.name}</span>
                  {item.label && (
                    <span className="text-sm text-gray-400">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px mx-4 my-4 bg-gray-100" />

        {/* Messages Section - Separate from categories */}
        <p className="px-4 mb-2 text-base font-semibold tracking-wider text-gray-400 uppercase">
          Communication
        </p>
        <Link
          to="/chat"
          className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
            isActive("/chat")
              ? "bg-emerald-50 text-emerald-600 font-medium"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <MessageSquare
            className={`size-5 mr-3 ${
              isActive("/chat") ? "text-emerald-600" : ""
            }`}
          />
          <div className="flex flex-col">
            <span className="text-base">Messages</span>
            <span className="text-sm text-gray-400">Real-time Chat</span>
          </div>
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 space-y-2">
        <Link
          to="/report"
          className="flex items-center px-4 py-2 text-sm text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-50"
        >
          <AlertCircle className="mr-2 size-4" />
          Report Issue
        </Link>
        <Link
          to="/terms"
          className="flex items-center px-4 py-2 text-sm text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-50"
        >
          <FileText className="mr-2 size-4" />
          Terms
        </Link>
        <div className="px-4 py-2 text-xs text-gray-400">© 2025 ShareCare</div>
      </div>
    </aside>
  );
}
