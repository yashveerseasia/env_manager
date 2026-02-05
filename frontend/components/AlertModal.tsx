'use client';

interface AlertModalProps {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export default function AlertModal({
  open,
  title = 'Notice',
  message,
  onClose,
  variant = 'error',
}: AlertModalProps) {
  if (!open) return null;

  const variantStyles = {
    error: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
      button: 'bg-red-600 hover:bg-red-500 focus:ring-red-500',
    },
    warning: {
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      iconPath: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
      button: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500',
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      iconPath: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
      button: 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500',
    },
  };

  const style = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div
                className={`mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
              >
                <svg
                  className={`h-7 w-7 ${style.iconColor}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={style.iconPath}
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex w-full justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.button}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
