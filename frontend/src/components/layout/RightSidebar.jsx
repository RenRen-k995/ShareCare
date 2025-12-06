import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Users, Package, Award } from "lucide-react";

export default function RightSidebar() {
  // Mock data - in a real app, this would come from an API
  const [stats] = useState({
    activeDonors: 89,
    itemsShared: 120,
    weeklyGrowth: "+15%",
  });

  return (
    <aside className="flex-shrink-0 py-5 space-y-6 overflow-y-auto w-96">
      {/* Community Stats */}
      <div className="p-6 bg-white rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-5 text-emerald-600" />
          <h3 className="font-bold text-gray-900">Community Stats</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full size-10 bg-emerald-600">
                <Users className="text-white size-5" />
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

          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full size-10 bg-emerald-600">
                <Package className="text-white size-5" />
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

          <div className="p-3 text-center bg-gray-100 rounded-xl">
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
