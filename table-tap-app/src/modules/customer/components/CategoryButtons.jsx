import { ChevronDown, Sandwich, UtensilsCrossed, CupSoda, IceCream, Tag } from 'lucide-react';

const CategoryButtons = ({ activeCategory, handleCategoryClick, categoryButtonsRef, menuOpen }) => {
  const getCategoryIcon = (name) => {
    switch (name) {
      case 'Snacks':
        return <Sandwich className="w-6 h-6" color="gray" />;
      case 'Main Course':
        return <UtensilsCrossed className="w-6 h-6" color="gray" />;
      case 'Beverages':
        return <CupSoda className="w-6 h-6" color="gray" />;
      case 'Dessert':
        return <IceCream className="w-6 h-6" color="gray" />;
      case 'Offers':
        return <Tag className="w-6 h-6" color="gray" />;
      default:
        return null;
    }
  };

  const categories = ['Snacks', 'Main Course', 'Beverages', 'Dessert', 'Offers'];

  return (
    <div
      className="grid grid-cols-5 gap-x-1.5 sm:gap-x-3 w-full px-2 sm:px-5 md:flex md:justify-center md:items-center md:gap-[10%] md:px-0 mb-4"
      ref={categoryButtonsRef}
    >
      {categories.map((categoryName, index) => (
        <button
          type="button"
          key={index}
          className="flex flex-col items-center relative focus:outline-none justify-center min-w-0 md:flex-none"
          onClick={(e) => handleCategoryClick(categoryName, e)}
        >
          <div
            className={`${
              activeCategory === categoryName
                ? 'bg-orange-200 text-orange-700'
                : 'bg-orange-100 text-orange-600'
            } rounded-3xl shadow-md hover:bg-orange-200 transition-all flex items-center justify-center w-[3.25rem] h-[3.25rem] sm:w-16 sm:h-16`}
          >
            {getCategoryIcon(categoryName)}
          </div>
          <span className="text-black text-[10px] sm:text-xs mt-1.5 text-center leading-tight w-full px-0.5">
            {categoryName}
          </span>
          {categoryName === activeCategory && menuOpen && (
            <ChevronDown className="h-3 w-3 text-black absolute -bottom-3" />
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryButtons;
