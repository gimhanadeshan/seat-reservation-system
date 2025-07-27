/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Monitor, X, Clock, User } from "lucide-react";
import Link from "next/link";

interface Reservation {
  id: string;
  date: string;
  status: "ACTIVE" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  seat: {
    id: string;
    seatNumber: string;
    location: string;
    hasMonitor: boolean;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "past" | "cancelled"
  >("upcoming");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  // Fetch reservations
  useEffect(() => {
    if (session) {
      fetchReservations();
    }
  }, [session]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      let url = "/api/reservations";

      // Only add status filter if needed
      if (filter !== "all") {
        url += `?status=${
          filter === "upcoming"
            ? "ACTIVE"
            : filter === "past"
            ? "COMPLETED"
            : filter === "cancelled"
            ? "CANCELLED"
            : ""
        }`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReservations(data.data || data); // Handle both wrapped and direct responses
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchReservations(); // Refresh reservations
        alert("Reservation cancelled successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to cancel reservation");
      }
    } catch (error) {
      alert("Error cancelling reservation");
    }
  };

  // Filter reservations
  const filteredReservations = reservations.filter((reservation) => {
    const reservationDate = new Date(reservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (filter) {
      case "upcoming":
        return reservation.status === "ACTIVE" && reservationDate >= today;
      case "past":
        return reservation.status === "COMPLETED" || reservationDate < today;
      case "cancelled":
        return reservation.status === "CANCELLED";
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (reservation: Reservation) => {
    const reservationDate = new Date(reservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservation.status === "CANCELLED") return "Cancelled";
    if (reservationDate < today) return "Completed";
    if (reservationDate.toDateString() === today.toDateString()) return "Today";
    return "Upcoming";
  };

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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {session.user?.name}
            </h1>
            <p className="text-gray-600">{session.user?.email}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-gray-600">Manage your seat reservations</p>
          <Link
            href="/reserve"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Reservation
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">
            {
              reservations.filter(
                (r) => r.status === "ACTIVE" && new Date(r.date) >= new Date()
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {
              reservations.filter(
                (r) => r.status === "COMPLETED" || new Date(r.date) < new Date()
              ).length
            }
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-red-600">
            {reservations.filter((r) => r.status === "CANCELLED").length}
          </div>
          <div className="text-sm text-gray-600">Cancelled</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-600">
            {reservations.length}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: "upcoming", label: "Upcoming" },
              { key: "past", label: "Past" },
              { key: "cancelled", label: "Cancelled" },
              { key: "all", label: "All" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    filter === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {tab.label} (
                {
                  reservations.filter((r) => {
                    const reservationDate = new Date(r.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    switch (tab.key) {
                      case "upcoming":
                        return (
                          r.status === "ACTIVE" && reservationDate >= today
                        );
                      case "past":
                        return (
                          r.status === "COMPLETED" || reservationDate < today
                        );
                      case "cancelled":
                        return r.status === "CANCELLED";
                      default:
                        return true;
                    }
                  }).length
                }
                )
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading reservations...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No reservations found.</p>
          <Link
            href="/reserve"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Make Your First Reservation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Seat Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-blue-600">
                        {reservation.seat.seatNumber}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Seat {reservation.seat.seatNumber}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {reservation.seat.location}
                        {reservation.seat.hasMonitor && (
                          <>
                            <Monitor className="w-4 h-4 ml-3 mr-1" />
                            Monitor
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(reservation.date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        Reserved{" "}
                        {new Date(reservation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center space-x-4">
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${getStatusColor(getStatusText(reservation).toLowerCase())}
                  `}
                  >
                    {getStatusText(reservation)}
                  </span>

                  {reservation.status === "ACTIVE" &&
                    new Date(reservation.date) >= new Date() && (
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm">Cancel</span>
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
