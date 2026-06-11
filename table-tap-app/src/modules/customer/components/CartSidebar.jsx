import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../shared/config/CartContent';
import { useLiveOrder } from '../../shared/context/LiveOrderContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import FoodImageWithFallback from './FoodImageWithFallback';
import { getOrderItemQty } from '../api/liveOrderService';

const CartSidebar = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeItem, calculateEffectivePrice } = useCart();
  const {
    activeLiveOrder,
    hasActiveLiveOrder,
    liveOrdersEnabled,
    appendCartToLiveOrder,
    refreshActiveLiveOrder,
    submitting,
    error: liveOrderError,
  } = useLiveOrder();
  const navigate = useNavigate();
  const isLiveOrderMode = liveOrdersEnabled && hasActiveLiveOrder;
  const sidebarRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Swipe detection
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50; // Minimum swipe distance
    const swipeDistance = touchEndX.current - touchStartX.current;

    // If swiped right (positive distance) and distance is significant
    if (swipeDistance > swipeThreshold) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen && liveOrdersEnabled && hasActiveLiveOrder) {
      refreshActiveLiveOrder();
    }
  }, [isOpen, liveOrdersEnabled, hasActiveLiveOrder, refreshActiveLiveOrder]);

  // Add keyboard support for escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Memoize price calculations to prevent unnecessary recalculations
  const priceDetails = useMemo(() => {
    let originalTotal = 0;
    let discountAmount = 0;
    let taxableAmount = 0;

    cartItems.forEach((item) => {
      // Calculate original price total
      const originalItemTotal = item.price * item.quantity;
      originalTotal += originalItemTotal;

      // Calculate discount amount
      const effectivePrice =
        item.effectivePrice !== undefined ? item.effectivePrice : calculateEffectivePrice(item);

      const itemDiscount = (item.price - effectivePrice) * item.quantity;
      discountAmount += itemDiscount;

      // Calculate subtotal after discount for tax calculation
      const itemSubtotal = effectivePrice * item.quantity;

      // Check if the item is water (exempt from GST)
      const isWater =
        item.name &&
        (item.name.toLowerCase().includes('water') || item.category?.toLowerCase() === 'water');

      if (!isWater) {
        taxableAmount += itemSubtotal;
      }
    });

    // Calculate taxes (split into CGST and SGST equally, each at 2.5%)
    const cgst = taxableAmount * 0.025; // 2.5% CGST
    const sgst = taxableAmount * 0.025; // 2.5% SGST

    // Subtotal is original total minus discount
    const subtotalAfterDiscount = originalTotal - discountAmount;

    // Final total is subtotal plus taxes
    const finalTotal = subtotalAfterDiscount + cgst + sgst;

    return {
      originalTotal,
      discountAmount,
      subtotalAfterDiscount,
      cgst,
      sgst,
      finalTotal,
    };
  }, [cartItems, calculateEffectivePrice]);

  const { originalTotal, discountAmount, subtotalAfterDiscount, cgst, sgst, finalTotal } =
    priceDetails;

  // Memoize event handlers
  const handleNormalCheckout = useCallback(() => {
    onClose();
    navigate('/order-confirmation');
  }, [navigate, onClose]);

  const handleAddToLiveOrder = useCallback(async () => {
    const order = await appendCartToLiveOrder();
    if (order) {
      toast.success(
        hasActiveLiveOrder
          ? `Added to live order · KOT #${order.kot_count}`
          : 'Live order started · sent to kitchen',
      );
      onClose();
    }
  }, [appendCartToLiveOrder, hasActiveLiveOrder, onClose]);

  const getSentQty = useCallback(
    (item) => {
      if (!isLiveOrderMode) return 0;
      return getOrderItemQty(item, activeLiveOrder?.items);
    },
    [isLiveOrderMode, activeLiveOrder?.items],
  );

  const handleQuantityUpdate = useCallback(
    (itemId, category, newQuantity) => {
      const item = cartItems.find(
        (cartItem) =>
          String(cartItem.id) === String(itemId) &&
          (category ? cartItem.category === category : true),
      );
      const sentQty = item ? getSentQty(item) : 0;

      if (isLiveOrderMode && newQuantity < sentQty) {
        toast.error(
          sentQty > 0
            ? `${sentQty} already sent to kitchen. Ask staff to change your order.`
            : 'Cannot remove this item',
        );
        return;
      }

      if (newQuantity < 1) {
        removeItem(itemId, category);
      } else {
        updateQuantity(itemId, category, newQuantity);
      }
    },
    [cartItems, getSentQty, isLiveOrderMode, removeItem, updateQuantity],
  );

  const slideVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        duration: 0.4,
      },
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            ref={sidebarRef}
            key="cart-content"
            className="fixed top-0 right-0 h-full w-full md:w-8/12 lg:w-7/10 z-50 overflow-hidden rounded-tl-[80px] rounded-bl-[80px]"
            style={{ maxWidth: '70%' }}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Enhanced glassy background with multiple layers */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl"></div>

            {/* Glass effect layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/5 to-transparent"></div>

            {/* Additional glass highlights */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* Border glow effect */}
            <div className="absolute inset-0 rounded-tl-[80px] rounded-bl-[80px] border border-white/20 shadow-2xl"></div>

            {/* Inner glass border */}
            <div className="absolute inset-1 rounded-tl-[75px] rounded-bl-[75px] border border-white/10"></div>

            {/* Main content */}
            <div className="relative h-full flex flex-col">
              {/* Header with enhanced glass effect */}
              <div className="flex justify-center items-center pt-8 pb-4">
                <div
                  className={`backdrop-blur-md rounded-full p-3 mr-3 border shadow-xl ${
                    isLiveOrderMode
                      ? 'bg-green-600 border-green-400/50'
                      : 'bg-white/30 border-white/30'
                  }`}
                >
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                  {isLiveOrderMode ? 'Live Cart' : 'Cart'}
                </h2>
              </div>

              <div className="border-t border-white/30 w-full my-4"></div>

              {/* Cart items count */}
              <div className="px-6 mb-4">
                <h3 className="text-white text-sm drop-shadow-sm whitespace-nowrap text-center">
                  You have {cartItems.length} items in the cart
                </h3>
                {isLiveOrderMode && (
                  <p className="text-white/50 text-xs text-center mt-2 px-2">
                    Items already sent to the kitchen cannot be removed here. You can only reduce
                    quantities above what was sent.
                  </p>
                )}
              </div>

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto px-6">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center mt-8">
                    <p className="text-white/70 text-center mb-4 drop-shadow-sm">
                      {isLiveOrderMode
                        ? 'Add items to update your live order'
                        : 'Your cart is empty'}
                    </p>
                    <button
                      onClick={onClose}
                      className="bg-white/30 backdrop-blur-md text-white rounded-full w-12 h-12 flex items-center justify-center text-3xl shadow-xl hover:bg-white/40 transition-all border border-white/30"
                      aria-label="Close Cart"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  cartItems.map((item, index) => {
                    // Check if the item is water
                    const isWater =
                      item.name &&
                      (item.name.toLowerCase().includes('water') ||
                        item.category?.toLowerCase() === 'water');

                    // Calculate discounted price
                    const hasDiscount = item.discounttype && item.discountvalue;
                    const originalPrice = Number(item.price).toFixed(2);

                    // Use effectivePrice if it exists, otherwise calculate it
                    const discountedPrice =
                      item.effectivePrice !== undefined
                        ? Number(item.effectivePrice).toFixed(2)
                        : Number(calculateEffectivePrice(item)).toFixed(2);

                    const sentQty = getSentQty(item);
                    const pendingQty = Math.max(0, item.quantity - sentQty);

                    return (
                      <div key={`${item.id}-${item.category}`} className="mb-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all shadow-lg">
                          <div className="w-[72px] h-[72px] shrink-0 overflow-hidden rounded-lg border border-white/30 shadow-md">
                            <FoodImageWithFallback
                              src={item.image}
                              alt={item.name}
                              category={item.category}
                              itemName={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-1">
                            <h3 className="text-white font-medium text-sm leading-snug line-clamp-2 drop-shadow-sm">
                              {item.name}
                            </h3>
                            {hasDiscount ? (
                              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <p className="text-white/50 text-xs line-through">
                                  ₹{originalPrice}
                                </p>
                                <p className="text-white font-semibold text-sm">
                                  ₹{discountedPrice}
                                </p>
                                {item.discounttype === 'Percentage' && (
                                  <span className="text-green-300 text-xs">
                                    {item.discountvalue}% off
                                  </span>
                                )}
                                {item.discounttype === 'Fixed' && (
                                  <span className="text-green-300 text-xs">
                                    ₹{item.discountvalue} off
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-white font-semibold text-sm mt-1">
                                ₹{originalPrice}
                              </p>
                            )}
                            {isWater && <p className="text-green-300 text-xs mt-0.5">GST exempt</p>}
                            {isLiveOrderMode && sentQty > 0 && (
                              <p className="text-green-300/80 text-xs mt-0.5">
                                {sentQty} sent
                                {pendingQty > 0 ? ` · ${pendingQty} not sent yet` : ''}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-1.5 py-1 border border-white/25">
                            <button
                              onClick={() =>
                                handleQuantityUpdate(item.id, item.category, item.quantity - 1)
                              }
                              disabled={isLiveOrderMode && item.quantity <= sentQty}
                              className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-40 disabled:pointer-events-none"
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus className="h-3.5 w-3.5 text-white" />
                            </button>
                            <span className="min-w-[1.25rem] text-center text-white font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityUpdate(item.id, item.category, item.quantity + 1)
                              }
                              className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-white/20 transition-all"
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus className="h-3.5 w-3.5 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pricing information with enhanced glass effect */}
              {cartItems.length > 0 && (
                <div className="px-6 pb-4">
                  {/* Enhanced glassy pricing display */}
                  <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-lg p-4 mb-3 shadow-2xl">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Original</span>
                        <span className="text-white">₹{originalTotal.toFixed(2)}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-green-300">Discount</span>
                          <span className="text-green-300">- ₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Subtotal</span>
                        <span className="text-white">₹{subtotalAfterDiscount.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-xs text-white/50">
                        <span>CGST + SGST (5%)</span>
                        <span>₹{(cgst + sgst).toFixed(2)}</span>
                      </div>

                      <div className="border-t border-white/30 my-1"></div>

                      <div className="flex justify-between text-sm">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-white font-bold">₹{finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout button with enhanced glass effect */}
                  {liveOrderError && (
                    <p className="text-red-300 text-xs text-center mb-2 px-4">{liveOrderError}</p>
                  )}
                  <div className="w-full flex flex-col items-center gap-2">
                    <button
                      className="w-full max-w-xs text-white font-medium py-3 px-8 rounded-full text-lg bg-gray-700 hover:bg-gray-800 transition-all shadow-xl"
                      onClick={handleNormalCheckout}
                    >
                      Place Order
                    </button>
                    {liveOrdersEnabled && (
                      <button
                        className="w-full max-w-xs text-white font-medium py-3 px-8 rounded-full text-lg bg-green-600 hover:bg-green-700 transition-all shadow-xl disabled:opacity-60"
                        onClick={handleAddToLiveOrder}
                        disabled={submitting}
                      >
                        {submitting
                          ? 'Sending...'
                          : isLiveOrderMode
                            ? 'Add to Live Order'
                            : 'Start Live Order'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            key="cart-overlay"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
