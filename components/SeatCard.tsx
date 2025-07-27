// components/SeatCard.tsx
"use client";

import { useState } from "react";
import { Monitor, User, Calendar, MapPin } from "lucide-react";

interface SeatCardProps {
  seat: {
    id: string;
    seatNumber: string;
    location: string;
    hasMonitor: boolean;
    isAvailable: boolean;
    reservedBy?: {
      name: string;
      email: string;
    };
    reservedDate?: string;
  };
  onReserve?: (seatId: string) => void;
  onCancel?: (seatId: string) => void;
  isReserving?: boolean;
  canReserve?: boolean;
}

export default function SeatCard({
  seat,
  onReserve,
  onCancel,
  isReserving = false,
  canReserve = true,
}: SeatCardProps) {
  const [loading, setLoading] = useState(false);

  const handleReserve = async () => {
    if (!onReserve) return;
    setLoading(true);
    try {
      await onReserve(seat.id);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setLoading(true);
    try {
      await onCancel(seat.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
      bg-white rounded-lg border-2 p-6 transition-all duration-200 hover:shadow-lg
      ${
        seat.isAvailable
          ? "border-green-200 hover:border-green-300"
          : "border-red-200 hover:border-red-300"
      }
    `}
    >
      {/* Seat Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`
            w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
            ${seat.isAvailable ? "bg-green-500" : "bg-red-500"}
          `}
          >
            {seat.seatNumber}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Seat {seat.seatNumber}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              {seat.location}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`
          px-3 py-1 rounded-full text-xs font-medium
          ${
            seat.isAvailable
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }
        `}
        >
          {seat.isAvailable ? "Available" : "Reserved"}
        </span>
      </div>

      {/* Seat Features */}
      <div className="flex items-center space-x-4 mb-4">
        {seat.hasMonitor && (
          <div className="flex items-center text-sm text-gray-600">
            <Monitor className="w-4 h-4 mr-1" />
            Monitor
          </div>
        )}
      </div>

      {/* Reservation Info */}
      {!seat.isAvailable && seat.reservedBy && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <User className="w-4 h-4 mr-1" />
            Reserved by: {seat.reservedBy.name}
          </div>
          {seat.reservedDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              Date: {new Date(seat.reservedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {seat.isAvailable && canReserve && onReserve && (
          <button
            onClick={handleReserve}
            disabled={loading || isReserving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Reserving..." : "Reserve"}
          </button>
        )}

        {!seat.isAvailable && onCancel && (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Canceling..." : "Cancel"}
          </button>
        )}

        {!canReserve && seat.isAvailable && (
          <button
            disabled
            className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg font-medium cursor-not-allowed"
          >
            Not Available
          </button>
        )}
      </div>
    </div>
  );
}
