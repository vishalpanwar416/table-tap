const PriceDisplay = ({ item, className = '', percentageClass = '' }) => {
    const basePrice = typeof item?.price === 'number' ? item.price : parseFloat(item?.price) || 0;

    const calculatePrice = () => {
      if (item?.discountType === 'percentage' && item?.discountValue) {
        return basePrice * (1 - item.discountValue / 100);
      }
      if (item?.discountType === 'fixed' && item?.discountValue) {
        return basePrice - item.discountValue;
      }
      return basePrice;
    };

    const finalPrice = calculatePrice();
    const hasDiscount = finalPrice < basePrice;

    if (basePrice === 0 && !hasDiscount) return null;

    return (
      <div className={`flex flex-col items-end ${className}`}>
        {hasDiscount ? (
          <>
            <span className="line-through text-sm">
              ₹{basePrice.toFixed(2)}
            </span>
            <div className="flex items-center gap-1">
              <span>₹{finalPrice.toFixed(2)}</span>
              {item?.discountType === 'percentage' && (
                <span className={`text-xs px-1 rounded ${percentageClass}`}>
                  {item.discountValue}% OFF
                </span>
              )}
            </div>
          </>
        ) : (
          <span>₹{basePrice.toFixed(2)}</span>
        )}
      </div>
    );
  };
  
  export default PriceDisplay;