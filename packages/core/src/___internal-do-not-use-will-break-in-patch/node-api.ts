import { BaseListTypeInfo, KeystoneConfig } from '../types';
import { createSystem } from '../lib/createSystem';
import { initConfig } from '../lib/config/initConfig';
import { KeystoneListsAPI } from './../types/context';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var keystoneQueryAPI: KeystoneListsAPI<Record<string, BaseListTypeInfo>>;
}

function createKeystoneQueryAPI(config: KeystoneConfig, prismaClient: any) {
  const { getKeystone } = createSystem(initConfig(config));
  const keystone = getKeystone(prismaClient);
  keystone.connect();
  return keystone.createContext({ sudo: true }).query;
}

export const createQueryAPI = globalThis.keystoneQueryAPI || createKeystoneQueryAPI;

if (process.env.NODE_ENV !== 'production') globalThis.keystoneQueryAPI = createQueryAPI;
