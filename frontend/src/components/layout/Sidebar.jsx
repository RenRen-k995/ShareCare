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

  const navigation = [
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
    {
      name: "Messages",
      href: "/chat",
      icon: MessageSquare,
      label: "Real-time Chat",
    },
  ];

  const isActive = (href) => {
    if (href === "/") {
      return location.pathname === "/" && !location.search;
    }
    return location.pathname + location.search === href;
  };

  return (
    <aside className="flex flex-col bg-white w-[17rem]">
      {/* Logo */}
      <div className="px-6 py-8">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold text-gray-900">ShareCare</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-4 py-3 rounded-xl transition-all duration-200
                ${
                  active
                    ? "bg-slate-50 text-gray-900 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                }
              `}
            >
              <Icon
                className={`w-5 h-5 mr-3 ${active ? "text-emerald-500" : ""}`}
              />
              <div className="flex flex-col">
                <span className="text-sm">{item.name}</span>
                {item.label && (
                  <span className="text-xs text-gray-400">{item.label}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 space-y-2 border-t border-gray-100">
        <Link
          to="/report"
          className="flex items-center px-4 py-2 text-sm text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-slate-50"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Report Issue
        </Link>
        <Link
          to="/terms"
          className="flex items-center px-4 py-2 text-sm text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-slate-50"
        >
          <FileText className="w-4 h-4 mr-2" />
          Terms
        </Link>
        <div className="px-4 py-2 text-xs text-gray-400">© 2025 ShareCare</div>
      </div>
    </aside>
  );
}
