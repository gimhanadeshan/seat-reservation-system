// components/ConfirmationModal.tsx
import { TriangleAlert, X, Check } from "lucide-react";
import { useState } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void; // Updated to support async functions
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean; // Optional prop if you want to control loading from parent
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmation",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading: parentLoading, // Optional parent-controlled loading state
}: ConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  // Use parent loading state if provided, otherwise use internal state
  const loading = parentLoading !== undefined ? parentLoading : isLoading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xm z-50 p-4">
      {/* Modal Box */}
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg animate-fadeIn">
        {/* Header with Warning Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TriangleAlert className="text-yellow-500 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-800 ">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 cursor-pointer"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700">{message}</p>

        {/* Buttons */}
        <div className="flex justify-end mt-6 gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-700 rounded-md hover:text-gray-900 hover:underline transition-colors cursor-pointer disabled:opacity-50"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4" />
            {cancelText}
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-red-600 rounded-md hover:text-red-700 hover:underline transition-colors cursor-pointer disabled:opacity-50"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Check className="w-4 h-4" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
