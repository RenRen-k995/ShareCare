import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import RightSidebar from "./RightSidebar";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left Sidebar - Fixed, White */}
      <Sidebar />

      {/* Main Area - Header + Content Wrapper */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header - Sticky, White */}
        <Header />

        {/* Main Scrollable Area 
           - This acts as the viewport/window for the sticky element
        */}
        <main className="flex-1 overflow-y-auto bg-[#F5F7F7] rounded-tl-[25px] shadow-inner p-6">
          {/* Layout Container */}
          <div className="flex justify-center max-w-[1280px] mx-auto gap-8 items-start">
            {/* Middle Content (Feed) - Grows to fill space */}
            <div className="flex-1 max-w-3xl min-w-0">{children}</div>

            {/* Right Sidebar - Sticky & Fixed width */}
            {/* Added 'sticky' and 'top-0' (or top-6 for spacing) */}
            <div className="sticky top-0 hidden xl:block w-80 shrink-0">
              <RightSidebar />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
