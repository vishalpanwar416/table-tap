import { ChevronDown, Sandwich, UtensilsCrossed, CupSoda, IceCream, Tag } from 'lucide-react';

const CategoryButtons = ({  
  activeCategory, 
  handleCategoryClick, 
  categoryButtonsRef 
}) => {
  const getCategoryIcon = (name) => {
    switch(name) {
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
    <div className="flex justify-center items-center gap-1 md:gap-[10%]" ref={categoryButtonsRef}>
      {categories.map((categoryName, index) => (
        <button
          key={index}
          className="flex flex-col items-center relative focus:outline-none"
          onClick={(e) => handleCategoryClick({ name: categoryName }, e)}
        >
          <div className={`${
            activeCategory === categoryName 
              ? 'bg-orange-200 text-orange-700' 
              : 'bg-orange-100 text-orange-600'
          } rounded-3xl px-4 py-3 shadow-md hover:bg-orange-200 transition-all flex items-center justify-center w-16 h-16`}>
            {getCategoryIcon(categoryName)}
          </div>
          <span className="text-black text-xs mt-2">{categoryName}</span>
          {categoryName === activeCategory && (
            <ChevronDown className="h-3 w-3 text-black absolute -bottom-3" />
          )}
        </button>
      ))}
    </div>
  );
};

export default CategoryButtons;