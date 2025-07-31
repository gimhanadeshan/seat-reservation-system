/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SeatCard from "@/components/SeatCard";
import ConfirmationModal from "@/components/ConfirmationModal";
import Alert from "@/components/Alert";
import { Calendar, Filter, Search, MapPin, Grid, List } from "lucide-react";
import Loader from "@/components/Loader";

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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info" | "warning";
    message: string;
    show: boolean;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("map");
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchSeats();
  }, [selectedDate]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seats?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setSeats(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error("Error fetching seats:", error);
      showAlert("error", "Failed to load seats");
    } finally {
      setLoading(false);
    }
  };

  const handleReserveClick = (seatId: string) => {
    setSelectedSeat(seatId);
    setShowConfirmation(true);
  };

  const handleReserveConfirm = async () => {
    if (!selectedSeat) return;

    setIsReserving(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatId: selectedSeat,
          date: selectedDate,
        }),
      });

      if (response.ok) {
        await fetchSeats();
        showAlert("success", "Seat reserved successfully!");
      } else {
        const error = await response.json();
        showAlert("error", error.message || "Failed to reserve seat");
      }
    } catch (error) {
      showAlert("error", "Error reserving seat");
    } finally {
      setIsReserving(false);
      setShowConfirmation(false);
      setSelectedSeat(null);
    }
  };

  const showAlert = (
    type: "success" | "error" | "info" | "warning",
    message: string
  ) => {
    setAlert({ type, message, show: true });
    setTimeout(() => setAlert(null), 3000);
  };

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
        <Loader />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Group seats by location for the office map view
  const groupedByLocation = filteredSeats.reduce((acc, seat) => {
    if (!acc[seat.location]) {
      acc[seat.location] = [];
    }
    acc[seat.location].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {alert?.show && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleReserveConfirm}
        title="Confirm Reservation"
        message="Are you sure you want to reserve this seat?"
        confirmText="Reserve"
      />

      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reserve a Seat
            </h1>
            <p className="text-gray-600">
              Choose your preferred seat for the selected date
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("map")}
              className={`p-2 rounded-md ${
                viewMode === "map" ? "bg-blue-100 text-blue-600" : "bg-gray-100"
              }`}
              title="Map View"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${
                viewMode === "grid"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100"
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

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

      {loading ? (
        <div className="text-center py-12">
          <Loader />
          <p className="mt-2 text-gray-600">Loading seats...</p>
        </div>
      ) : filteredSeats.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No seats found matching your criteria.
          </p>
        </div>
      ) : viewMode === "map" ? (
        <div className="space-y-8">
          {Object.entries(groupedByLocation).map(
            ([location, locationSeats]) => (
              <div key={location} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">{location}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {locationSeats.map((seat) => (
                    <SeatCard
                      key={seat.id}
                      seat={seat}
                      onReserve={handleReserveClick}
                      canReserve={true}
                      compact={true}
                      isReserving={isReserving}
                    />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Legend */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-2">Seat Status</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span className="text-sm">Reserved</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                <span className="text-sm">Unavailable</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm">Has Monitor</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableSeats.map((seat) => (
            <SeatCard
              key={seat.id}
              seat={seat}
              onReserve={handleReserveClick}
              canReserve={true}
            />
          ))}
          {reservedSeats.map((seat) => (
            <SeatCard key={seat.id} seat={seat} canReserve={false} />
          ))}
        </div>
      )}
    </div>
  );
}
