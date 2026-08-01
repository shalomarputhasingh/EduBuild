import { DataTypes } from 'sequelize';
import bcryptjs from 'bcryptjs';
import { sequelize } from '../config/db.js';

/**
 * Two roles only: 'user' and 'admin'.
 * A 'user' is a creator/publisher of project guides — a teacher, in product copy.
 * Admin is granted out-of-band via scripts/promoteAdmin.js, never at signup.
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) {
        // Normalize here rather than at the call site so every write path —
        // signup, seeding, scripts — stores the same canonical form.
        this.setDataValue('email', String(value || '').trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false,
    },
    school: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    state: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
  },
  {
    tableName: 'edubuild_users',
    timestamps: true,
    defaultScope: {
      // Password is opt-in, so it cannot be leaked by a controller that forgets
      // to exclude it. comparePassword() re-reads it explicitly when needed.
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: { attributes: { include: ['password'] } },
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcryptjs.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcryptjs.hash(user.password, 10);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function comparePassword(plainPassword) {
  if (!this.password || !plainPassword) return false;
  return bcryptjs.compare(plainPassword, this.password);
};

export default User;
