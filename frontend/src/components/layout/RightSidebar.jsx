import React, { useState } from "react";
import { TrendingUp, Users, Package } from "lucide-react";

export default function RightSidebar() {
  const [stats] = useState({
    activeDonors: 89,
    itemsShared: 120,
    weeklyGrowth: "+15%",
  });

  return (
    <aside className="flex-shrink-0 py-5 pr-6 space-y-6 overflow-y-auto w-80">
      {/* Community Stats */}
      <div className="p-6 neu-card neu-card-hover rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-500" />
          <h3 className="font-bold text-gray-900">Community Stats</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Active Donors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDonors}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Items Shared</p>
                <p className="text-2xl font-bold text-gray-900">{stats.itemsShared}</p>
              </div>
            </div>
          </div>

          <div className="p-3 text-center rounded-xl bg-gray-50">
            <p className="mb-1 text-xs text-gray-600">This Week</p>
            <p className="text-lg font-bold text-primary-600">{stats.weeklyGrowth}</p>
            <p className="text-xs text-gray-500">items re-homed</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
