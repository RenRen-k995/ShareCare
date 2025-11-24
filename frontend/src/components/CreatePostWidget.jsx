import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Image, FileText } from "lucide-react";
import { Button } from "./ui/button";

export default function CreatePostWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreateClick = () => {
    navigate("/posts/new");
  };

  return (
    <div className="p-6 mb-4 bg-white shadow-sm rounded-2xl">
      <div className="flex items-start space-x-4">
        {/* User Avatar */}
        <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 font-semibold text-white rounded-full bg-gradient-to-br from-blue-400 to-indigo-500">
          {user?.username?.charAt(0).toUpperCase() || "U"}
        </div>

        {/* Input Area */}
        <div className="flex-1">
          <button
            onClick={handleCreateClick}
            className="w-full px-6 py-4 text-left text-gray-400 transition-colors border-2 border-transparent cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-2xl hover:border-emerald-200"
          >
            What would you like to share today? (Item, Knowledge, or Support)
          </button>

          {/* Action Buttons */}
          <div className="flex items-center mt-4 space-x-4">
            <button
              onClick={handleCreateClick}
              className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-emerald-600"
            >
              <div className="p-2 transition-colors rounded-lg hover:bg-emerald-50">
                <Image className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Image</span>
            </button>

            <button
              onClick={handleCreateClick}
              className="flex items-center space-x-2 text-gray-600 transition-colors hover:text-blue-600"
            >
              <div className="p-2 transition-colors rounded-lg hover:bg-blue-50">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Document</span>
            </button>

            <div className="flex-1"></div>

            <Button
              onClick={handleCreateClick}
              className="px-8 text-white transition-all rounded-full shadow-md bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 hover:shadow-lg"
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
// File re-created as CreatePostWidget; ensure no leftover code remains
