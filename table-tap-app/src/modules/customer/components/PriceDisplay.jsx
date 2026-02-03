const PriceDisplay = ({ item, className = '', percentageClass = '' }) => {
    const calculatePrice = () => {
      if (item.discountType === 'percentage') {
        return item.price * (1 - item.discountValue/100);
      }
      if (item.discountType === 'fixed') {
        return item.price - item.discountValue;
      }
      return item.price;
    };
  
    const finalPrice = calculatePrice();
    const hasDiscount = finalPrice < item.price;
  
    return (
      <div className={`flex flex-col items-end ${className}`}>
        {hasDiscount ? (
          <>
            <span className="line-through text-sm">
              ₹{item.price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1">
              <span>₹{finalPrice.toFixed(2)}</span>
              {item.discountType === 'percentage' && (
                <span className={`text-xs px-1 rounded ${percentageClass}`}>
                  {item.discountValue}% OFF
                </span>
              )}
            </div>
          </>
        ) : (
          <span>₹{item.price.toFixed(2)}</span>
        )}
      </div>
    );
  };
  
  export default PriceDisplay;