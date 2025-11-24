import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Package, Award } from "lucide-react";

export default function RightSidebar() {
  // Mock data - in a real app, this would come from an API
  const [stats, setStats] = useState({
    activeDonors: 89,
    itemsShared: 120,
    weeklyGrowth: "+15%",
  });

  return (
    <aside className="flex-shrink-0 py-6 pr-6 space-y-6 overflow-y-auto w-80">
      {/* Community Stats */}
      <div className="p-6 bg-white shadow-sm rounded-2xl">
        <div className="flex items-center mb-4 space-x-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-gray-900">Community Stats</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Active Donors
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeDonors}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Items Shared
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.itemsShared}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 text-center bg-slate-50 rounded-xl">
            <p className="mb-1 text-xs text-gray-600">This Week</p>
            <p className="text-lg font-bold text-emerald-600">
              {stats.weeklyGrowth}
            </p>
            <p className="text-xs text-gray-500">items re-homed</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
