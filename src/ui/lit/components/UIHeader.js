import { LitElement, html, css } from 'lit'
import { icon } from '@nan0web/icons/adapters/lit'
import { BsGithub, BsSunFill, BsMoonFill, BsCircleHalf, BsList, BsXLg } from '@nan0web/icons/bs'
import { HeaderModel } from '@nan0web/ui/domain'

export class UIHeader extends LitElement {
	static properties = {
		brand: { type: String },
		logo: { type: String },
		socials: { type: Array },
		nav: { type: Array },
		locale: { type: String },
		locales: { type: Array },
		localeUrls: { type: Object },
		theme: { type: String },
		_mobileOpen: { type: Boolean, state: true },
	}

	constructor() {
		super()
		this.theme = localStorage.getItem('nan0sync-theme') || 'auto'
		this.locale = 'uk'
		this.locales = []
		this.localeUrls = {}
		this.nav = []
		this.socials = []
		this._mobileOpen = false
	}

	static styles = css`
		* {
			box-sizing: border-box;
		}
		:host {
			display: block;
			position: sticky;
			top: 0;
			z-index: 100;
			border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
			background: color-mix(in srgb, var(--bg-page, #fff) 80%, transparent);
			-webkit-backdrop-filter: saturate(180%) blur(20px);
			backdrop-filter: saturate(180%) blur(20px);

			/* Full Bleed: stretch to 100vw regardless of parent container */
			width: 100vw;
			margin-left: calc(-50vw + 50%);
		}
		.bar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1rem 1.5rem;
			max-width: 1200px;
			margin: 0 auto;
		}
		.brand-group {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}
		.brand-logo {
			display: flex;
			align-items: center;
			text-decoration: none;
			color: var(--text-primary);
			font-size: 1.25rem;
			font-weight: 800;
			letter-spacing: -0.5px;
			gap: 0.4rem;
			transition: color 0.2s;
		}
		.brand-logo:hover {
			color: var(--accent);
		}
		.brand-logo img {
			display: block;
			height: 24px;
		}
		.brand-slash {
			color: var(--text-secondary);
			font-weight: 300;
			margin: 0 0.2rem;
		}
		.pkg-link {
			text-decoration: none;
			color: var(--accent);
			font-weight: 700;
			font-size: 1.25rem;
			letter-spacing: -0.5px;
		}
		.pkg-link:hover {
			color: var(--text-primary);
		}
		/* Desktop controls */
		.desktop-controls {
			display: none;
			gap: 0.75rem;
			align-items: center;
		}
		@media (min-width: 900px) {
			.desktop-controls {
				display: flex;
			}
			.burger {
				display: none !important;
			}
		}

		.nav-links {
			display: flex;
			gap: 1rem;
			align-items: center;
		}
		.nav-links a {
			color: var(--text-secondary);
			text-decoration: none;
			transition: color 0.2s;
			font-size: 0.9rem;
		}
		.nav-links a:hover {
			color: var(--text-primary);
		}

		.divider {
			width: 1px;
			height: 20px;
			background: var(--border);
		}

		.icon-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.4rem;
			border-radius: 8px;
			cursor: pointer;
			border: 1px solid var(--border);
			background: transparent;
			color: var(--text-secondary);
			transition: all 0.2s;
			text-decoration: none;
		}
		.icon-btn:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
		}

		.locale-group {
			display: flex;
			align-items: center;
			gap: 0.15rem;
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 0.15rem;
		}
		.locale-link {
			display: block;
			padding: 0.25rem 0.5rem;
			font-size: 0.8rem;
			font-weight: 600;
			text-transform: uppercase;
			border-radius: 6px;
			transition: all 0.2s;
			color: var(--text-secondary);
			text-decoration: none;
		}
		.locale-link:hover {
			color: var(--text-primary);
		}
		.locale-link.active {
			background: var(--accent-bg);
			color: var(--accent);
			pointer-events: none;
		}

		.theme-group {
			display: flex;
			align-items: center;
			gap: 0.15rem;
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 0.15rem;
		}
		.theme-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.3rem;
			border: none;
			background: transparent;
			color: var(--text-secondary);
			cursor: pointer;
			border-radius: 6px;
			transition: all 0.2s;
		}
		.theme-btn:hover {
			color: var(--text-primary);
		}
		.theme-btn.active {
			background: var(--accent-bg);
			color: var(--accent);
		}

		/* Hamburger button */
		.burger {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.4rem;
			border-radius: 8px;
			cursor: pointer;
			border: 1px solid var(--border);
			background: transparent;
			color: var(--text-secondary);
			transition: all 0.2s;
		}
		.burger:hover {
			background: var(--bg-hover);
			color: var(--text-primary);
		}

		/* Mobile drawer */
		.mobile-drawer {
			display: grid;
			grid-template-rows: 0fr;
			transition:
				grid-template-rows 0.3s ease,
				padding 0.3s ease;
			overflow: hidden;
			padding: 0;
			border-top: 1px solid transparent;
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			margin-left: calc(-50vw + 50%);
			width: 100vw;
			background: color-mix(in srgb, var(--bg-page, #fff) 95%, transparent);
			-webkit-backdrop-filter: saturate(180%) blur(20px);
			backdrop-filter: saturate(180%) blur(20px);
			height: 0;
		}
		.mobile-drawer > .drawer-inner {
			overflow: hidden;
			display: flex;
			flex-direction: column;
			justify-content: center;
			height: 100%;
			padding: 2rem;
		}
		.mobile-drawer.open {
			grid-template-rows: 1fr;
			height: calc(100vh - 100%); /* full viewport minus header */
			border-top-color: var(--border);
		}
		@media (min-width: 900px) {
			.mobile-drawer {
				display: none !important;
			}
		}

		.mobile-nav-group {
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
			margin-bottom: auto;
			margin-top: auto;
			align-items: center;
		}

		.mobile-drawer a.nav-item {
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 44px;
			padding: 0 1rem;
			font-size: 1.5rem;
			font-weight: 600;
			letter-spacing: -0.2px;
			color: var(--text-primary);
			text-decoration: none;
			transition:
				color 0.15s ease,
				opacity 0.15s ease;
			-webkit-tap-highlight-color: transparent;
		}
		.mobile-drawer a.nav-item:active {
			opacity: 0.7;
		}

		.mobile-controls {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.75rem;
			padding-top: 0.25rem;
		}
		.mobile-controls .platform-link {
			font-weight: 600;
			color: var(--accent);
		}
	`

	_onNavClick(e) {
		e.preventDefault()
		const id = e.currentTarget.getAttribute('href').replace('#', '')
		const target = document.getElementById(id)
		if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
		this._mobileOpen = false
	}

	_toggleMobile() {
		this._mobileOpen = !this._mobileOpen
	}

	_onThemeChange(t) {
		this.theme = t
		localStorage.setItem('nan0sync-theme', t)
		this.dispatchEvent(
			new CustomEvent('theme-change', { detail: t, bubbles: true, composed: true }),
		)
	}

	_onLocaleClick(e, loc, url) {
		e.preventDefault()
		localStorage.setItem('nan0sync-locale', loc)
		this.dispatchEvent(
			new CustomEvent('locale-change', {
				detail: { locale: loc, url },
				bubbles: true,
				composed: true,
			}),
		)
	}

	_renderLocale() {
		return html`
			<div class="locale-group">
				${(this.locales || []).map((loc) => {
					const url = this.localeUrls?.[loc] || `/${loc}/index.html`
					return html`
						<a
							href="${url}"
							class="locale-link ${loc === this.locale ? 'active' : ''}"
							@click=${(e) => this._onLocaleClick(e, loc, url)}
							>${loc}</a
						>
					`
				})}
			</div>
		`
	}

	_renderTheme() {
		return html`
			<div class="theme-group">
				<button
					class="theme-btn ${this.theme === 'light' ? 'active' : ''}"
					@click=${() => this._onThemeChange('light')}
					title="Light"
				>
					${icon(BsSunFill, { size: 14 })}
				</button>
				<button
					class="theme-btn ${this.theme === 'auto' ? 'active' : ''}"
					@click=${() => this._onThemeChange('auto')}
					title="Auto"
				>
					${icon(BsCircleHalf, { size: 14 })}
				</button>
				<button
					class="theme-btn ${this.theme === 'dark' ? 'active' : ''}"
					@click=${() => this._onThemeChange('dark')}
					title="Dark"
				>
					${icon(BsMoonFill, { size: 14 })}
				</button>
			</div>
		`
	}

	render() {
		// Model-as-Schema enforces contracts internally
		const model = new HeaderModel({
			brand: this.brand || 'NaN•Web',
			logo: this.logo,
			socials: this.socials,
			nav: this.nav,
			locale: this.locale,
			locales: this.locales
		})

		const parts = model.brand.text.split('•')

		return html`
			<!-- Top bar -->
			<div class="bar">
				<div class="brand-group">
					<a href="${model.brand.href}" class="brand-logo" target="_blank" rel="noopener">
						${model.logo ? html`
						<img
							src="${import.meta.env.BASE_URL || '/'}${model.logo}"
							alt="logo"
							style="margin-right: 2px; transition: opacity 0.2s;"
							onmouseover="this.style.opacity=0.7"
							onmouseout="this.style.opacity=1"
							onerror="this.style.display='none'"
						/>` : ''}
						${parts.length > 1 ? html`${parts[0]}<span style="color:var(--accent)">•</span>${parts[1]}` : html`${parts[0]}`}
					</a>
				</div>
				<!-- Desktop -->
				<div class="desktop-controls">
					<div class="nav-links">
						${(model.nav || []).map(
							(n) => html` <a href="#${n.href || n.id}" @click=${this._onNavClick}>${n.text}</a> `,
						)}
					</div>
					<div class="divider"></div>
					${this._renderLocale()} ${this._renderTheme()}
					${model.socials && model.socials.length > 0
						? model.socials.map(soc => {
								return html`
									<a
										href="${soc.href}"
										target="_blank"
										rel="noopener"
										class="icon-btn"
										aria-label="${soc.text}"
									>
										${soc.text.toLowerCase().includes('github') ? icon(BsGithub, { size: 18 }) : soc.text}
									</a>
								`
						  })
						: ''}
				</div>

				<!-- Mobile hamburger -->
				<button class="burger" @click=${this._toggleMobile} aria-label="Menu">
					${this._mobileOpen ? icon(BsXLg, { size: 20 }) : icon(BsList, { size: 22 })}
				</button>
			</div>

			<!-- Mobile drawer -->
			<div class="mobile-drawer ${this._mobileOpen ? 'open' : ''}">
				<div class="drawer-inner">
					<div class="mobile-nav-group">
						${(model.nav || []).map(
							(n) => html`
								<a href="#${n.href || n.id}" class="nav-item" @click=${this._onNavClick}>${n.text}</a>
							`,
						)}
					</div>
					<div class="mobile-controls">
						${this._renderLocale()} ${this._renderTheme()}
						${model.socials && model.socials.length > 0
							? model.socials.map(soc => {
									return html`
										<a
											href="${soc.href}"
											target="_blank"
											rel="noopener"
											class="icon-btn"
											aria-label="${soc.text}"
										>
											${soc.text.toLowerCase().includes('github') ? icon(BsGithub, { size: 18 }) : soc.text}
										</a>
									`
							  })
							: ''}
					</div>
				</div>
			</div>
		`
	}
}

customElements.define('ui-header', UIHeader)
