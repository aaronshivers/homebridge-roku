'use strict';

const { RokuClient } = require('roku-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const deepmerge = require('deepmerge');

const HOMEBRIDGE_CONFIG = path.join(os.homedir(), '.homebridge', 'config.json');

/**
 * Generate or merge the configuration for homebridge-roku by querying
 * roku for information and installed apps.
 * @return {Promise<Object>}
 */
async function generateConfig() {
  const client = await RokuClient.discover();
  const [info, apps] = await Promise.all([client.info(), client.apps()]);
  const inputs = apps.map((app) => ({ id: app.id, name: app.name }));
  return {
    accessories: [
      {
        name: 'Roku',
        accessory: 'Roku',
        ip: client.ip,
        inputs,
        info,
      },
    ],
  };
}

/**
 * Pass to `deepmerge` to merge together objects with the same name
 * within merging arrays.
 * @param {any[]} dest The destination array.
 * @param {any[]} source The source array.
 * @return {any[]} The new merged array.
 */
function arrayMerge(dest, source) {
  const merged = dest.map((destEl) => {
    if (!('name' in destEl)) {
      return destEl;
    }
    const idx = source.findIndex((sourceEl) => destEl.name === sourceEl.name);
    if (idx >= 0) {
      const [match] = source.splice(idx, 1);
      return deepmerge(destEl, match);
    }
    return destEl;
  });
  return [...merged, ...source];
}

/**
 * Merge two config files together. Assumes that
 * string arguments are file names and loads them
 * before merging.
 * @param {Object|string} configAName
 * @param {Object|string} configBName
 * @return {Object} The merged config.
 */
function mergeConfigs(configAName, configBName) {
  function readConfig(name) {
    if (typeof name === 'string') {
      return JSON.parse(fs.readFileSync(name, 'utf-8'));
    }
    return name;
  }
  const configA = readConfig(configAName);
  const configB = readConfig(configBName);
  return deepmerge(configA, configB, { arrayMerge });
}

/**
 * Merge the given config object with the existing homebridge config.
 * @param {Object} toMerge
 */
function mergeConfigWithMaster(toMerge) {
  try {
    const merged = mergeConfigs(HOMEBRIDGE_CONFIG, toMerge);
    fs.writeFileSync(HOMEBRIDGE_CONFIG, JSON.stringify(merged, null, 4));
  } catch (err) {
    console.error(`There was a problem merging the config: ${err}`);
  }
}

module.exports = {
  generateConfig,
  mergeConfigs,
  mergeConfigWithMaster,
  HOMEBRIDGE_CONFIG,
};
