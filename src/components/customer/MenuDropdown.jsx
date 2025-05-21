import { X, Heart, ShoppingBag } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useCart } from "../../config/CartContent";
import { useLikes } from "../../config/LikesContent";
import PriceDisplay from './PriceDisplay'

const MenuDropdown = ({
  menuOpen,
  handleCloseMenu,
  menuPosition,
  activeCategory,
  menuItems,
  categoryButtonsRef,
}) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);
  const dropdownRef = useRef(null);
  const itemsPerPage = 5;

  const { cartItems, addToCart, updateQuantity, removeItem } = useCart();
  const { likedItems, toggleLike } = useLikes();

  const getCartQuantity = (itemId) => {
    const cartItem = cartItems.find((item) => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  useEffect(() => {
    if (menuOpen && menuItems) {
      setVisibleItems(menuItems.slice(0, itemsPerPage));
      setPage(1);
    }
  }, [activeCategory, menuOpen, menuItems]);

  const loadMoreItems = useCallback(() => {
    if (loading || !menuItems) return;

    if (visibleItems.length >= menuItems.length) return;

    setLoading(true);

    setTimeout(() => {
      const nextItems = menuItems.slice(0, (page + 1) * itemsPerPage);
      setVisibleItems(nextItems);
      setPage((p) => p + 1);
      setLoading(false);
    }, 300);
  }, [loading, page, menuItems, visibleItems]);

  useEffect(() => {
    if (!menuOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [menuOpen, loadMoreItems]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        categoryButtonsRef.current &&
        !categoryButtonsRef.current.contains(event.target)
      ) {
        handleCloseMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, handleCloseMenu, categoryButtonsRef]);

  if (!menuOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-0 z-20"
        onClick={(e) => {
          if (
            categoryButtonsRef.current &&
            !categoryButtonsRef.current.contains(e.target)
          ) {
            handleCloseMenu();
          }
        }}
      ></div>
      <div
        ref={dropdownRef}
        className="absolute bg-white rounded-xl shadow-xl z-30 overflow-hidden animate-slide-down font-spartan-medium text-black"
        style={{
          top: `${menuPosition.top}px`,
          left: "0",
          width: "100%",
          transform: "translateY(10px)",
          height: "100vh",
          maxHeight: "none",
        }}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h3 className="text-black font-semibold text-center flex-1 text-xl font-spartan-medium">
            {activeCategory} Menu
          </h3>
          <button
            onClick={handleCloseMenu}
            className="text-gray-500 hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto" style={{ height: "calc(100% - 56px)" }}>
          {visibleItems.map((item) => {
            const quantity = getCartQuantity(item.id);

            return (
              <div
                key={`${item.id}-${item.category}`}
                className="p-4 hover:bg-gray-200 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors"
              >
                {/* Image container with consistent positioning */}
                <div className="w-full h-48 md:h-64 relative mb-4">
                  <div className="w-full h-full md:w-3/5 md:mx-auto overflow-hidden rounded-xl relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center"
                    />
                    <button
                      className="absolute top-3 left-3 bg-white bg-opacity-70 rounded-full p-1.5 shadow-md hover:bg-opacity-100 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(item);
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 md:h-5 md:w-5 ${
                          likedItems.some((li) => li.id === item.id)
                            ? "text-red-500 fill-red-500"
                            : "text-gray-500"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-start mt-2">
                  <div className="flex-1">
                    <p className="text-black font-medium text-lg">{item.name}</p>
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                  </div>
                  <PriceDisplay
                    item={item}
                    className="text-black font-semibold text-lg"
                    percentageClass="bg-gray-200 text-gray-800"
                  />
                </div>
                {/* Tags if available */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-end mt-3">
                  {quantity > 0 ? (
                    <div className="flex items-center bg-black/80 rounded-full px-3 py-1 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (quantity === 1) {
                            removeItem(item.id, item.category);
                          } else {
                            updateQuantity(item.id, quantity - 1, item.category);
                          }
                        }}
                        className="text-white hover:bg-black/70 rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="text-white text-sm">{quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="text-white hover:bg-black/70 rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(item);
                      }}
                      className="bg-black/80 hover:bg-black/70 text-white rounded-full px-4 py-2 transition-colors flex items-center"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span className="ml-2">Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {menuItems && visibleItems.length < menuItems.length && (
            <div ref={loaderRef} className="flex justify-center p-4">
              {loading ? (
                <div className="animate-pulse text-gray-500">
                  Loading more items...
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Scroll to load more</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const Divider = () => {
  return (
    <div className="my-4 w-full mx-auto h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>
  );
};

export { MenuDropdown, Divider };