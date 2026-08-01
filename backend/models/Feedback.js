import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * A teacher's review of a project guide.
 *
 * `userName` and `schoolName` are denormalized copies taken from the author's
 * account at submission time, so a review keeps reading correctly if the author
 * later changes schools. They are filled in server-side from the authenticated
 * user — never from the request body.
 *
 * One review per user per project, enforced by a unique constraint in
 * migration 0002 rather than by an application-level check.
 */
const Feedback = sequelize.define(
  'Feedback',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schoolName: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
    },
    feedback: {
      type: DataTypes.TEXT,
    },
    rating: {
      type: DataTypes.INTEGER,
      validate: { min: 1, max: 5 },
    },
  },
  {
    tableName: 'edubuild_feedbacks',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['projectId', 'userId'],
        name: 'edubuild_feedbacks_project_user_unique',
      },
    ],
  }
);

export default Feedback;
