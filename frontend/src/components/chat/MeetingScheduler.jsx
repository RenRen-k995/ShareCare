import { useState } from "react";
import { X, Calendar, MapPin, Clock, Package } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import exchangeService from "../../services/exchangeService";

export default function MeetingScheduler({ exchange, onClose, onScheduled }) {
  const [formData, setFormData] = useState({
    scheduledTime: "",
    method: "meet_halfway",
    locationAddress: "",
    locationCoordinates: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const meetingDetails = {
        scheduledTime: new Date(formData.scheduledTime),
        method: formData.method,
        location: {
          address: formData.locationAddress,
          coordinates: formData.locationCoordinates
            ? formData.locationCoordinates
                .split(",")
                .map((c) => parseFloat(c.trim()))
            : undefined,
        },
        notes: formData.notes || undefined,
      };

      await exchangeService.scheduleMeeting(exchange._id, meetingDetails);
      onScheduled();
      onClose();
    } catch (err) {
      console.error("Error scheduling meeting:", err);
      setError(err.response?.data?.message || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="scheduledTime" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Date & Time
            </Label>
            <Input
              id="scheduledTime"
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) =>
                setFormData({ ...formData, scheduledTime: e.target.value })
              }
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label htmlFor="method" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Exchange Method
            </Label>
            <select
              id="method"
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="pickup">I'll pick it up</option>
              <option value="delivery">Deliver to me</option>
              <option value="meet_halfway">Meet halfway</option>
            </select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label
              htmlFor="locationAddress"
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Meeting Location
            </Label>
            <Input
              id="locationAddress"
              type="text"
              placeholder="e.g., Central Park, Main Street, etc."
              value={formData.locationAddress}
              onChange={(e) =>
                setFormData({ ...formData, locationAddress: e.target.value })
              }
              required
            />
            <p className="text-xs text-gray-500">
              Enter a public, safe location for the exchange
            </p>
          </div>

          {/* Coordinates (optional) */}
          <div className="space-y-2">
            <Label
              htmlFor="locationCoordinates"
              className="text-sm text-gray-600"
            >
              GPS Coordinates (optional)
            </Label>
            <Input
              id="locationCoordinates"
              type="text"
              placeholder="e.g., 40.7829, -73.9654"
              value={formData.locationCoordinates}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  locationCoordinates: e.target.value,
                })
              }
            />
            <p className="text-xs text-gray-500">Format: latitude, longitude</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or details..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
            >
              {loading ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
