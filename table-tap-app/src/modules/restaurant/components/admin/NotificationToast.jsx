import React, { useState, useEffect } from 'react';

const NotificationToast = ({
  show,
  message,
  title,
  type = 'info',
  onClose,
  autoClose = true,
  duration = 5000,
  onAccept,
  onReject
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  // Swipe to dismiss logic
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to allow render before animating in
      requestAnimationFrame(() => setIsVisible(true));

      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          // Wait for animation to finish before unmounting
          setTimeout(() => {
            setShouldRender(false);
            onClose?.();
          }, 300);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, duration, onClose]);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > minSwipeDistance;
    if (isSwipeUp) {
      setIsVisible(false);
      setTimeout(() => {
        setShouldRender(false);
        onClose?.();
      }, 300);
    }
  };

  if (!shouldRender && !show) return null;

  // Icons mapping
  const typeIcons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
    order: '🔔'
  };

  // Border colors based on type
  const borderColors = {
    success: 'border-green-200',
    error: 'border-red-200',
    info: 'border-blue-200',
    warning: 'border-primary-200',
    order: 'border-primary-200'
  };

  // Animation classes
  // Mobile: slide down from top. Desktop: slide left from right.
  const animationClass = isVisible
    ? 'opacity-100 translate-y-0 md:translate-x-0'
    : 'opacity-0 -translate-y-4 md:translate-y-0 md:translate-x-full';

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={`fixed top-2 left-2 right-2 md:top-6 md:left-auto md:right-6 md:w-96 z-[10000] 
        bg-white border ${borderColors[type] || 'border-gray-200'} rounded-xl shadow-lg 
        p-2.5 md:p-4 flex items-start gap-2.5 md:gap-3 transition-all duration-300 ease-out ${animationClass}`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
    >
      <div className="flex-shrink-0 text-lg md:text-xl mt-0.5">
        {typeIcons[type] || '🔔'}
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-0.5 leading-tight md:line-clamp-none line-clamp-1">
            {title}
          </h4>
        )}
        <p className={`text-xs md:text-sm text-gray-600 leading-snug md:leading-relaxed ${title ? '' : 'font-medium text-gray-900'} md:line-clamp-none line-clamp-2`}>
          {message}
        </p>

        {(onAccept || onReject) && (
          <div className="mt-2 flex gap-2">
            {onAccept && (
              <button
                onClick={onAccept}
                className="bg-green-500 hover:bg-green-600 text-white text-[10px] md:text-xs font-medium px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                Accept
              </button>
            )}
            {onReject && (
              <button
                onClick={onReject}
                className="bg-red-500 hover:bg-red-600 text-white text-[10px] md:text-xs font-medium px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                Reject
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            setShouldRender(false);
            onClose?.();
          }, 300);
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-0.5 md:p-1"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-4 md:h-4">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export default NotificationToast;