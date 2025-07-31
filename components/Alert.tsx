// components/Alert.tsx
import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

interface AlertProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
  duration?: number;
}

export default function Alert({
  type,
  message,
  onClose,
  duration = 3000,
}: AlertProps) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const alertClasses = {
    success: "bg-green-100 border-green-400 text-green-700",
    error: "bg-red-100 border-red-400 text-red-700",
    info: "bg-blue-100 border-blue-400 text-blue-700",
    warning: "bg-yellow-100 border-yellow-400 text-yellow-700",
  };

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <div
      className={`${alertClasses[type]} border px-4 py-3 rounded fixed top-4 right-4 z-50 min-w-[300px] flex items-start gap-2`}
      role="alert"
    >
      <div className="mt-0.5">{iconMap[type]}</div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <span className="block sm:inline">{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}