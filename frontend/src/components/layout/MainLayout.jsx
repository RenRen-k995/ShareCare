import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import RightSidebar from "./RightSidebar";

export default function MainLayout({
  children,
  rightSidebar,
  leftSidebar = true,
}) {
  const shouldRenderRightSidebar = rightSidebar !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Hidden on mobile */}
      {leftSidebar && (
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      )}

      {/* Main Area - Header + Content Wrapper */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header />

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-background rounded-tl-3xl px-4 md:px-6 relative">
          {/* Layout Container */}
          <div className="flex justify-center max-w-6xl mx-auto gap-4 md:gap-8 items-start">
            {/* Middle Content (Feed) */}
            <div
              className={`flex-1 min-w-0 ${
                shouldRenderRightSidebar ? "max-w-3xl" : "w-full"
              }`}
            >
              {children}
            </div>

            {/* Right Sidebar - Sticky & Fixed width */}
            {shouldRenderRightSidebar && (
              <div className="sticky top-0 hidden xl:block w-80 shrink-0">
                {rightSidebar === undefined ? <RightSidebar /> : rightSidebar}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
