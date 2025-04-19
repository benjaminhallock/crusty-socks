import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  position = "center",
  size = "md",
}) => {
  // Map size to max-width class
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  // Map position to alignment classes
  const positionClasses = {
    center: "items-center justify-center",
    top: "items-start justify-center pt-20",
    bottom: "items-end justify-center pb-20",
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div
            className={`flex min-h-full p-4 text-center ${positionClasses[position]}`}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all`}
              >
                <div className="relative">
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  )}

                  {title && (
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                    >
                      {title}
                    </Dialog.Title>
                  )}

                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
