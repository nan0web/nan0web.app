/**
 * @file Domain Models — public API for nan0web.app domain layer.
 *
 * All models are framework-agnostic value objects.
 * They describe WHAT the app manages, not HOW it renders.
 */
export { Model } from '@nan0web/core'
export { default as NaN0WebConfig } from './NaN0WebConfig.js'
export { default as AppEntryConfig } from './AppEntryConfig.js'
export { default as Page } from './Page.js'
export { default as LogConfig } from './LogConfig.js'
export { Navigation } from '@nan0web/ui/domain'
