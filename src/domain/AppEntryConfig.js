import { Model } from '@nan0web/core'

/**
 * AppEntryConfig — Model-as-Schema для запису підключеного додатку.
 *
 * Описує лише те, що потрібно sub-app:
 * - name: унікальний ідентифікатор (App.{Name}.* у data YAML)
 * - src: джерело встановлення (npm пакет або локальний шлях)
 * - dsn: джерело даних (за замовчуванням — спільне з батьком)
 * - locale: локаль (може перевизначати батьківську)
 *
 * @property {string} appName Унікальний ідентифікатор додатку
 * @property {string} src Джерело встановлення (npm пакет або шлях)
 * @property {string} dsn Джерело даних
 * @property {string} locale Локаль додатку
 */
export default class AppEntryConfig extends Model {
	static appName = {
		alias: 'name',
		help: 'Unique app identifier (maps to App.{Name}.* in data)',
		type: 'string',
		default: '',
		required: true,
	}
	static src = {
		help: 'Installation source — npm package or local path',
		type: 'string',
		placeholder: '@scope/app-name',
		default: '',
		required: true,
	}
	static dsn = {
		help: 'Data source (inherits parent if empty)',
		type: 'string',
		default: '',
	}
	static locale = {
		help: 'Locale override (inherits parent if empty)',
		type: 'string',
		default: '',
	}
	static isolation = {
		help: 'Isolate app state and data from others (Default: false)',
		type: 'boolean',
		default: false,
	}

	/** @returns {string} Alias accessor for appName */
	get name() { return this.appName }
}


