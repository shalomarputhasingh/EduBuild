import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * Admin-managed AI provider configuration.
 *
 * `apiKeyEncrypted` is ciphertext (see utils/crypto.js) and is excluded by the
 * default scope, so a controller cannot leak it by returning a row directly.
 * The one place that needs it asks for the `withSecret` scope explicitly.
 */
const AiProviderSetting = sequelize.define(
  'AiProviderSetting',
  {
    provider: {
      type: DataTypes.STRING(32),
      primaryKey: true,
    },
    apiKeyEncrypted: {
      type: DataTypes.TEXT,
    },
    /** Masked preview safe to show in the UI, e.g. `sk-pro••••••9f2a`. */
    apiKeyHint: {
      type: DataTypes.STRING(64),
    },
    model: {
      type: DataTypes.STRING(160),
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: 'edubuild_ai_providers',
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ['apiKeyEncrypted'] },
    },
    scopes: {
      withSecret: { attributes: { include: ['apiKeyEncrypted'] } },
    },
  }
);

export default AiProviderSetting;
