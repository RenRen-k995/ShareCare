import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : null
  );
  const containerRef = useRef(null);

  // Generate ranges
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i); // Last 100 years
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Helper to get days in a month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Update internal state when prop changes
  useEffect(() => {
    if (value) setSelectedDate(new Date(value));
  }, [value]);

  const handleSelect = (type, val) => {
    const newDate = selectedDate ? new Date(selectedDate) : new Date();

    if (type === "year") newDate.setFullYear(val);
    if (type === "month") newDate.setMonth(val - 1); // JS months are 0-indexed
    if (type === "day") newDate.setDate(val);

    // Validate day (e.g., if switching from Jan 31 to Feb)
    const daysInNewMonth = getDaysInMonth(
      newDate.getFullYear(),
      newDate.getMonth() + 1
    );
    if (newDate.getDate() > daysInNewMonth) {
      newDate.setDate(daysInNewMonth);
    }

    setSelectedDate(newDate);
    onChange(newDate.toISOString().split("T")[0]); // Return YYYY-MM-DD
  };

  const renderColumn = (items, type, currentVal) => (
    <div className="h-48 px-2 py-20 overflow-y-auto scrollbar-hide snap-y snap-mandatory">
      {items.map((item) => (
        <div
          key={item}
          onClick={() => handleSelect(type, item)}
          className={`
            py-2 text-center cursor-pointer text-sm transition-colors snap-center
            ${
              currentVal === item
                ? "text-cyan-500 font-bold text-lg"
                : "text-gray-400 hover:text-gray-600"
            }
          `}
        >
          {item}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
            flex items-center justify-between w-full h-12 px-4 bg-white border rounded-xl cursor-pointer transition-all
            ${
              isOpen
                ? "border-cyan-400 ring-2 ring-cyan-100"
                : "border-gray-200 hover:border-gray-300"
            }
        `}
      >
        <div className="flex items-center gap-3 text-gray-700">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className={!selectedDate ? "text-gray-400" : ""}>
            {selectedDate
              ? selectedDate.toLocaleDateString("en-CA") // YYYY-MM-DD format
              : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 overflow-hidden duration-200 bg-white border border-gray-100 shadow-xl rounded-2xl animate-in fade-in zoom-in-95">
          {/* Header / Close */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 bg-gray-50/50">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Select Date
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 transition-colors rounded-full hover:bg-gray-200"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Columns Grid */}
          <div className="relative grid grid-cols-3 gap-0 bg-white">
            {/* Selection Highlight Bar (Visual only) */}
            <div className="absolute z-0 h-8 -mt-4 rounded-lg pointer-events-none top-1/2 left-4 right-4 bg-cyan-50" />

            {/* Year Column */}
            <div className="relative z-10 border-r border-gray-50">
              {renderColumn(
                years,
                "year",
                selectedDate?.getFullYear() || currentYear
              )}
            </div>

            {/* Month Column */}
            <div className="relative z-10 border-r border-gray-50">
              {renderColumn(
                months,
                "month",
                (selectedDate?.getMonth() || 0) + 1
              )}
            </div>

            {/* Day Column */}
            <div className="relative z-10">
              {renderColumn(
                Array.from(
                  {
                    length: getDaysInMonth(
                      selectedDate?.getFullYear() || currentYear,
                      (selectedDate?.getMonth() || 0) + 1
                    ),
                  },
                  (_, i) => i + 1
                ),
                "day",
                selectedDate?.getDate() || 1
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
