/**
 * The only shape of a user that may leave the server.
 *
 * Declared once so no handler can accidentally serialise a Sequelize instance
 * whole and ship the password hash with it.
 */
export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  school: user.school,
  state: user.state,
});

export default publicUser;
