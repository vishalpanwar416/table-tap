const importAll = (r) => r.keys().map(r);

const images = importAll(require.context('../../Photos/Offer', false, /\.(png|jpe?g|svg)$/));

export const MaincaroselData = images.map((img, index) => ({
  imade: img,
  discount: ['30% OFF', '20% OFF', 'Buy 1 Get 1', 'Buy 1 Get 1'][index],
  message: [
    'Experience our delicious new dish',    
    'Try our spicy treat today',
    'Tastier than ever before!',
    'Tastier than ever before!',
  ][index],
}));