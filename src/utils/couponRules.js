export const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.Price * item.Count);
  }, 0);
};

export const isCouponApplicable = (items) => {
  return items.some(item => 
    item.Category === 'HotCoffeeMenu' || 
    item.Category === 'ColdCoffeeMenu'
  );
};

export const calculateTotalAfterDiscount = (items, coupon) => {
  if (!coupon) return calculateTotal(items);
  
  return items.reduce((total, item) => {
    if ((item.Category === 'HotCoffeeMenu' || item.Category === 'ColdCoffeeMenu') 
        && coupon.type === 'COFFEE_DISCOUNT') {
      return total; // Free coffee item
    }
    return total + (item.Price * item.Count);
  }, 0);
};