import { LitElement, html, css } from 'lit'
import { HeroModel } from '@nan0web/ui/domain'
export class UIHero extends LitElement {
	static properties = {
		badge: { type: String },
		title: { type: String },
		subtitle: { type: String },
		code: { type: String },
		cta: { type: String },
		ctaHref: { type: String },
	}

	static styles = css`
		:host {
			display: block;
			text-align: center;
			padding: 4rem 2rem;
			background: radial-gradient(circle at center, var(--accent-bg) 0%, var(--bg-surface) 60%);
			border: 1px solid var(--border);
			border-radius: 16px;
			margin-bottom: 2rem;
		}
		.badge {
			display: inline-block;
			padding: 0.3rem 1rem;
			background: var(--accent);
			color: #000;
			font-weight: bold;
			font-size: 0.85rem;
			border-radius: 99px;
			margin-bottom: 1.5rem;
		}
		h1 {
			font-size: clamp(1.5rem, 6vw, 2.5rem);
			margin: 0 0 1rem;
			color: var(--text-primary);
			line-height: 1.15;
			word-break: break-word;
		}
		.subtitle {
			color: var(--text-secondary);
			font-size: clamp(0.95rem, 2.5vw, 1.1rem);
			max-width: 600px;
			margin: 0 auto 2rem;
			line-height: 1.6;
		}
		.actions {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 1rem;
			flex-wrap: wrap;
		}
		.code {
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			font-size: clamp(0.8rem, 2.5vw, 0.95rem);
			padding: 0.75rem 1.5rem;
			background: var(--code-bg, #111);
			color: var(--text-secondary);
			border: 1px solid var(--border);
			border-radius: 10px;
		}
		.cta {
			padding: 0.75rem 2rem;
			font-size: 1rem;
			font-weight: bold;
			background: var(--accent);
			color: #000;
			border: none;
			border-radius: 10px;
			cursor: pointer;
			text-decoration: none;
			transition: opacity 0.2s;
		}
		.cta:hover {
			opacity: 0.85;
		}
		@media (max-width: 480px) {
			:host {
				padding: 2.5rem 1.25rem;
				border-radius: 12px;
			}
		}
	`

	render() {
		// Instantiate Model-as-Schema to handle validations and parsing logic
		const model = new HeroModel({
			badge: this.badge,
			title: this.title,
			subtitle: this.subtitle,
			code: this.code,
			cta: this.cta,
		})

		return html`
			<div class="badge">${model.badge}</div>
			<h1>${model.title}</h1>
			<div class="subtitle">${model.subtitle}</div>
			<div class="actions">
				${model.code ? html`<div class="code">${model.code}</div>` : ''}
				${model.cta ? html`<a href="${model.cta.href}" class="cta">${model.cta.text}</a>` : ''}
			</div>
		`
	}
}

customElements.define('ui-hero', UIHero)
