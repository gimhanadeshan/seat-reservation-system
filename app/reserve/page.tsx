/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// app/reserve/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SeatCard from "@/components/SeatCard";
import { Calendar, Filter, Search, MapPin } from "lucide-react";

interface Seat {
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
}

export default function ReservePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [locationFilter, setLocationFilter] = useState("");
  const [monitorFilter, setMonitorFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  // Fetch seats
  useEffect(() => {
    fetchSeats();
  }, [selectedDate]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seats?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        console.log("API response:", data);
        setSeats(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching seats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (seatId: string) => {
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatId,
          date: selectedDate,
        }),
      });

      if (response.ok) {
        fetchSeats(); // Refresh seats
        alert("Seat reserved successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to reserve seat");
      }
    } catch (error) {
      alert("Error reserving seat");
    }
  };

  // Filter seats
  const filteredSeats = seats.filter((seat) => {
    const matchesLocation = !locationFilter || seat.location === locationFilter;
    const matchesMonitor = !monitorFilter || seat.hasMonitor;
    const matchesSearch =
      !searchTerm ||
      seat.seatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.location.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesLocation && matchesMonitor && matchesSearch;
  });

  const availableSeats = filteredSeats.filter((seat) => seat.isAvailable);
  const reservedSeats = filteredSeats.filter((seat) => !seat.isAvailable);
  const locations = [...new Set(seats.map((seat) => seat.location))];

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reserve a Seat
        </h1>
        <p className="text-gray-600">
          Choose your preferred seat for the selected date
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Select a date"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label
              htmlFor="location-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <select
              id="location-filter"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>

              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Monitor Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Features
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={monitorFilter}
                onChange={(e) => setMonitorFilter(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Has Monitor</span>
            </label>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              placeholder="Seat number or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">
            {availableSeats.length}
          </div>
          <div className="text-sm text-green-600">Available Seats</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">
            {reservedSeats.length}
          </div>
          <div className="text-sm text-red-600">Reserved Seats</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">
            {filteredSeats.length}
          </div>
          <div className="text-sm text-blue-600">Total Seats</div>
        </div>
      </div>

      {/* Seats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading seats...</p>
        </div>
      ) : filteredSeats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No seats found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Available Seats First */}
          {availableSeats.map((seat) => (
            <SeatCard
              key={seat.id}
              seat={seat}
              onReserve={handleReserve}
              canReserve={true}
            />
          ))}

          {/* Reserved Seats */}
          {reservedSeats.map((seat) => (
            <SeatCard key={seat.id} seat={seat} canReserve={false} />
          ))}
        </div>
      )}
    </div>
  );
}
