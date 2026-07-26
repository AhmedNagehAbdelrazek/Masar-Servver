const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  RIDER: 'rider',
  PASSENGER:'passenger',
  MANAGER: 'manager',

};

const SIGNUP_ROLES = [ROLES.PASSENGER, ROLES.RIDER];

// THE RESOURCES AND ACTIONS THAT THE ADMIN CAN GIVE THEM WITH EACH ROLE LIKE [{resource: 'trip', actions: ['create', 'read', 'update', 'delete']}]; 
// CAN BE GIVEN TO A ROLE OF RIDER, AS A PERMISSION LIST OF RIDER
const ADMIN_RESOURCES = [
  "trip",
  "reservatoin",

];

const ADMIN_ACTIONS = ['create', 'read', 'update', 'delete'];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

module.exports = {
  ROLES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAGINATION,
  ADMIN_RESOURCES,
  ADMIN_ACTIONS,
};
