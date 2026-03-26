import { LitElement, html, css } from 'lit'
import { icon } from '@nan0web/icons/adapters/lit'
import { BsFolder, BsShieldLock, BsCloud, BsLaptop } from '@nan0web/icons/bs'

const ICON_MAP = {
	folder: BsFolder,
	ssh: BsShieldLock,
	s3: BsCloud,
	local: BsLaptop,
}

export class UIAdapters extends LitElement {
	static properties = {
		items: { type: Array },
	}

	static styles = css`
		:host {
			display: grid;
			grid-template-columns: 1fr;
			gap: 1.5rem;
			padding: 2rem 0;
		}
		@media (min-width: 768px) {
			:host {
				grid-template-columns: 1fr 1fr;
			}
		}
		.card {
			background: var(--bg-surface);
			padding: 1.5rem;
			border-radius: 12px;
			border: 1px solid var(--border);
			display: flex;
			align-items: flex-start;
			gap: 1.25rem;
			transition: border-color 0.2s;
		}
		.card:hover {
			border-color: var(--accent);
		}
		.icon {
			background: var(--accent-bg);
			padding: 0.85rem;
			border-radius: 10px;
			color: var(--accent);
			display: flex;
			flex-shrink: 0;
		}
		.content {
			flex: 1;
		}
		.title {
			font-size: 1.05rem;
			font-weight: bold;
			color: var(--text-primary);
			margin-bottom: 0.4rem;
		}
		.desc {
			color: var(--text-secondary);
			font-size: 0.9rem;
			line-height: 1.5;
		}
		.card.disabled {
			opacity: 0.5;
			border-color: transparent;
			background: var(--bg-hover);
			pointer-events: none;
		}
		.card.disabled .icon {
			background: rgba(255, 255, 255, 0.05);
			color: var(--text-secondary);
		}
	`

	render() {
		return html`
			${(this.items || []).map(
				(item) => html`
					<div
						class="card ${item.title.includes('В плані') || item.title.includes('Planned')
							? 'disabled'
							: ''}"
					>
						<div class="icon">
							${ICON_MAP[item.icon] ? icon(ICON_MAP[item.icon], { size: 22 }) : item.icon}
						</div>
						<div class="content">
							<div class="title">${item.title}</div>
							<div class="desc">${item.description}</div>
						</div>
					</div>
				`,
			)}
		`
	}
}

customElements.define('ui-adapters', UIAdapters)
