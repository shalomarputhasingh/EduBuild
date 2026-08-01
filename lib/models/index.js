/**
 * Model registry and associations.
 *
 * Import models from here rather than from their individual files, so the
 * associations below are always registered before any query runs. Importing
 * a model directly would work but would skip this file, and an `include:`
 * would then fail at runtime with "not associated".
 */
import { sequelize } from '../config/db.js';
import User from './User.js';
import Project from './Project.js';
import Feedback from './Feedback.js';
import AiProviderSetting from './AiProviderSetting.js';

// A user authors many projects. Deleting the author leaves the guides in place,
// unattributed — matching ON DELETE SET NULL in migration 0002.
User.hasMany(Project, { foreignKey: 'createdBy', as: 'projects', onDelete: 'SET NULL' });
Project.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Feedback has no meaning without its project or its author, so both cascade.
Project.hasMany(Feedback, { foreignKey: 'projectId', as: 'feedback', onDelete: 'CASCADE' });
Feedback.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Feedback, { foreignKey: 'userId', as: 'feedback', onDelete: 'CASCADE' });
Feedback.belongsTo(User, { foreignKey: 'userId', as: 'author' });

// Who last changed a provider's configuration, for an audit trail.
User.hasMany(AiProviderSetting, { foreignKey: 'updatedBy', as: 'aiSettingChanges' });
AiProviderSetting.belongsTo(User, { foreignKey: 'updatedBy', as: 'updatedByUser' });

export { sequelize, User, Project, Feedback, AiProviderSetting };
