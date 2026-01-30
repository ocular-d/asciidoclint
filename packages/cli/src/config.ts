import { promises as fs } from 'fs';
import { resolve } from 'path';
import { LintConfig } from '@asciidoclint/core';
import Debug from 'debug';

const debug = Debug('asciidoclint:config');

const DEFAULT_CONFIG: LintConfig & { enableInlineDirectives: boolean } = {
  rules: {
    'title-case': 'error',
    'no-trailing-spaces': 'warning',
    'max-line-length': 'warning'
  },
  enableInlineDirectives: true
};

export async function loadConfig(configPath?: string): Promise<LintConfig> {
  debug('Loading config from path: %s', configPath || 'default locations');
  
  if (configPath) {
    return await loadConfigFile(resolve(configPath));
  }
  
  // Try default config file locations
  const defaultPaths = [
    '.asciidoclintrc.json',
    '.asciidoclintrc.js',
    'asciidoclint.config.js',
    'asciidoclint.config.json'
  ];
  
  for (const path of defaultPaths) {
    try {
      const config = await loadConfigFile(resolve(path));
      debug('Loaded config from: %s', path);
      return config;
    } catch (error) {
      // Continue to next config file
      debug('Config file not found or invalid: %s', path);
    }
  }
  
  debug('Using default configuration');
  return DEFAULT_CONFIG;
}

async function loadConfigFile(filepath: string): Promise<LintConfig> {
  try {
    const content = await fs.readFile(filepath, 'utf8');
    
    if (filepath.endsWith('.json')) {
      return JSON.parse(content);
    } else if (filepath.endsWith('.js')) {
      // For simplicity, we'll treat JS files as JSON for now
      // In a real implementation, you'd use dynamic import
      const module = await import(filepath);
      return module.default || module;
    }
    
    throw new Error(`Unsupported config file format: ${filepath}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load config file ${filepath}: ${errorMessage}`);
  }
}