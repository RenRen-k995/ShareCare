import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, Check } from "lucide-react";

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value) : null
  );
  const [viewDate, setViewDate] = useState(
    value ? new Date(value) : new Date()
  );
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
      setViewDate(new Date(value));
    }
  }, [value]);

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    const formattedDate = newDate.toISOString().split("T")[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange("");
  };

  const formatDisplayDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(viewDate);
    const firstDay = firstDayOfMonth(viewDate);

    // Empty cells before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const isSelected =
        selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === viewDate.getMonth() &&
        selectedDate.getFullYear() === viewDate.getFullYear();

      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === viewDate.getMonth() &&
        new Date().getFullYear() === viewDate.getFullYear();

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={`
            p-2 text-sm rounded-lg transition-colors
            ${
              isSelected
                ? "bg-cyan-500 text-white font-bold"
                : isToday
                ? "bg-cyan-50 text-cyan-600 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full h-12 px-4 transition-all border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-20 focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={selectedDate ? "text-gray-900" : "text-gray-400"}>
            {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
          </span>
        </div>
        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 transition-colors rounded-full hover:bg-gray-200"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl w-80">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 transition-colors rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="font-semibold text-gray-900">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 transition-colors rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-xs font-semibold text-center text-gray-500"
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Days */}
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
