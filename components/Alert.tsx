import { X } from "lucide-react";
import { useEffect } from "react";

interface AlertProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  duration?: number;
}

export default function Alert({
  message,
  type,
  onClose,
  duration = 3000,
}: AlertProps) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-500";
      case "error":
        return "bg-red-50 border-red-500";
      case "warning":
        return "bg-yellow-50 border-yellow-500";
      case "info":
        return "bg-blue-50 border-blue-500";
      default:
        return "bg-gray-50 border-gray-500";
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-700";
      case "error":
        return "text-red-700";
      case "warning":
        return "text-yellow-700";
      case "info":
        return "text-blue-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 border-l-4 ${getBgColor()} p-4 shadow-lg max-w-md w-full`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <p className={`font-medium ${getTextColor()}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 ml-4"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
