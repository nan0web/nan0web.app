import { Model } from '@nan0web/core'
import { resolveAliases } from '@nan0web/types'
import { Navigation } from '@nan0web/ui/domain'
import AppEntryConfig from './AppEntryConfig.js'
import LogConfig from './LogConfig.js'

/**
 * NaN0Web Config Schema — Model-as-Schema for config prompt.
 * Used by Form.createFromBodySchema() in ui-cli.
 *
 * Static fields → schema metadata (help, placeholder, type, default).
 *
 * @property {string} appName Назва проєкту
 * @property {string} dsn Джерело даних (папка або рядок підключення)
 * @property {string} locale Локаль за замовчуванням
 * @property {number} port Порт сервера
 * @property {'light' | 'dark' | 'auto'} theme Тема інтерфейсу
 * @property {'index' | 'README'} directoryIndex Який файл є індексом директорії (index.md або README.md)
 * @property {{ cert: string, key: string }} ssl TLS/SSL конфіг для HTTPS (шляхи до сертифікату та ключа)
 * @property {LogConfig} log Налаштування логування
 * @property {AppEntryConfig[]} apps Масив підключених додатків
 */
export default class NaN0WebConfig extends Model {

	static appName = {
		alias: 'name',
		help: 'Project name',
		placeholder: 'my-app',
		default: '',
		required: true,
	}
	static dsn = {
		help: 'Data Source Name (folder or connection string)',
		placeholder: 'data/',
		default: 'data/',
	}
	static locale = {
		help: 'Default locale',
		placeholder: 'en',
		default: 'en',
	}
	static port = {
		help: 'Server port',
		placeholder: '3000',
		default: 3000,
	}
	static theme = {
		help: 'UI theme (light | dark | auto)',
		placeholder: 'auto',
		default: 'auto',
	}
	static aliases = {
		help: 'Virtual URI aliases (source -> target)',
		type: 'Record<string, string>',
		default: {},
		hidden: true,
	}
	static directoryIndex = {
		help: 'Directory index file name (index or README for git repos)',
		placeholder: 'index',
		default: 'index',
	}
	static ssl = {
		help: 'TLS/SSL config for HTTPS — { cert: "/path/cert.pem", key: "/path/key.pem" }',
		type: 'object',
		default: null,
		hidden: true,
	}
	static log = {
		help: 'Configuration for access and error logs',
		type: 'LogConfig',
		hint: LogConfig,
		default: {},
		hidden: true,
	}
	static apps = {
		help: 'Installed domain apps',
		type: 'AppEntryConfig[]',
		hint: AppEntryConfig,
		hidden: true,
		default: [],
	}

	/**
	 * @param {Partial<NaN0WebConfig>} [input]
	 */
	constructor(input = {}) {
		super(input)
		// Hydrate nested models
		if (this.log && !(this.log instanceof LogConfig)) {
			this.log = new LogConfig(this.log)
		}
		if (Array.isArray(this.apps)) {
			this.apps = this.apps.map(a =>
				a instanceof AppEntryConfig ? a : new AppEntryConfig(a)
			)
		}
	}

	/**
	 * @param {object} input
	 * @returns {NaN0WebConfig}
	 */
	static from(input) {
		if (input instanceof NaN0WebConfig) return input
		if (typeof input !== 'object' || input === null) return new NaN0WebConfig()
		return new NaN0WebConfig(resolveAliases(this, input))
	}
}

