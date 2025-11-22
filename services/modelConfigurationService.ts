import { DEFAULT_MODEL_CONFIG } from '../config/featureModelConfig';
import type { ModelConfig, FeatureId } from '../types';

type ModelConfigMap = Record<string, ModelConfig>;

class ModelConfigurationService {
  private config: ModelConfigMap;

  constructor() {
    this.config = { ...DEFAULT_MODEL_CONFIG };
    this.loadOverrides();
  }

  private loadOverrides() {
    // Check process.env for overrides
    // Format: REACT_APP_MODEL_{FEATURE_ID}
    // Format: REACT_APP_TEMP_{FEATURE_ID}
    const features: FeatureId[] = ['AI_APPLY', 'AI_DECISIONING', 'AI_ASSISTANT', 'ADDRESS_PARSING', 'APP_PARSING'];
    
    features.forEach(feature => {
        const modelEnv = process.env[`REACT_APP_MODEL_${feature}`];
        if (modelEnv) {
            if (!this.config[feature]) this.config[feature] = { model: modelEnv };
            else this.config[feature].model = modelEnv;
        }
        
        const tempEnv = process.env[`REACT_APP_TEMP_${feature}`];
        if (tempEnv) {
             if (!this.config[feature]) this.config[feature] = { model: 'gemini-2.5-flash', temperature: parseFloat(tempEnv) };
             else this.config[feature].temperature = parseFloat(tempEnv);
        }
    });
  }

  public getModelConfig(featureId: FeatureId): ModelConfig {
    const config = this.config[featureId];
    if (!config) {
      console.warn(`No configuration found for feature ${featureId}, falling back to default.`);
      return { model: 'gemini-2.5-flash', temperature: 0.5 };
    }
    return config;
  }
}

export const modelConfigService = new ModelConfigurationService();