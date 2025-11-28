import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import RightSidebar from "./RightSidebar";

export default function MainLayout({
  children,
  rightSidebar,
  leftSidebar = true,
}) {
  // If rightSidebar is explicitly null, we don't render it.
  // If it's undefined, we render the default RightSidebar.
  // If it's a component, we render that component.
  const shouldRenderRightSidebar = rightSidebar !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left Sidebar - Fixed, White */}
      {/* Conditionally render left sidebar */}
      {leftSidebar && <Sidebar />}

      {/* Main Area - Header + Content Wrapper */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header - Sticky, White */}
        <Header />

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto bg-[#F5F7F7] rounded-tl-[25px] shadow-inner px-6 relative">
          {/* Layout Container */}
          <div className="flex justify-center max-w-[1280px] mx-auto gap-8 items-start">
            {/* Middle Content (Feed) 
                - If right sidebar is present: max-w-3xl (Standard Feed)
                - If right sidebar is hidden: w-full (Profile/Full width pages)
            */}
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
                {/* Render custom right sidebar if provided, else default */}
                {rightSidebar === undefined ? <RightSidebar /> : rightSidebar}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
