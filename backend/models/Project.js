import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * A project guide.
 *
 * `materials` and `steps` hold arrays of objects. Rows created before the
 * structured model was introduced hold arrays of plain strings instead — both
 * shapes are converted by utils/normalizeProject.js on the way in and out, so
 * nothing in the application ever has to branch on which era a row came from.
 */
const Project = sequelize.define(
  'Project',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ─── Identity ────────────────────────────────────────────────────────────
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    summary: {
      type: DataTypes.STRING(280),
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    // ─── Classification ──────────────────────────────────────────────────────
    subject: {
      type: DataTypes.ENUM('Physics', 'Chemistry', 'Biology', 'Mathematics', 'Engineering'),
      allowNull: false,
    },
    concept: {
      type: DataTypes.STRING,
    },
    classLevel: {
      type: DataTypes.ENUM('6-8', '9-10', '11-12'),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
      defaultValue: 'Medium',
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    language: {
      type: DataTypes.STRING(8),
      defaultValue: 'en',
    },

    // ─── Practicalities ──────────────────────────────────────────────────────
    budget: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    estimatedTimeMinutes: {
      type: DataTypes.INTEGER,
    },

    // ─── Guide content ───────────────────────────────────────────────────────
    materials: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    steps: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    learningOutcomes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    safetyPrecautions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },

    // ─── Media ───────────────────────────────────────────────────────────────
    image: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    videoUrl: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    videoId: {
      type: DataTypes.STRING(16),
    },
    videoTitle: {
      type: DataTypes.STRING,
    },
    videoThumbnail: {
      type: DataTypes.STRING(512),
    },
    videoChannel: {
      type: DataTypes.STRING,
    },
    videoSource: {
      type: DataTypes.ENUM('manual', 'youtube_search', 'none'),
      defaultValue: 'none',
    },

    // ─── Moderation ──────────────────────────────────────────────────────────
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
    },

    // ─── Derived ─────────────────────────────────────────────────────────────
    // Recomputed from feedback rows. Never writable from a request body.
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0, max: 5 },
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: 'edubuild_projects',
    timestamps: true,
  }
);

export default Project;
