// import all models
const User = require('./User');
const UploadedImage = require('./UploadedImage');


// Relations between models 
// Example:
// Order.hasMany(OrderItem, { foreignKey: 'order_id' });
// OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

// Product.hasMany(OrderItem, { foreignKey: 'product_id' });
// OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

// Variant.hasMany(OrderItem, { foreignKey: 'variant_id' });
// OrderItem.belongsTo(Variant, { foreignKey: 'variant_id' });


// export all models
module.exports = {
  User,
  UploadedImage,
};
