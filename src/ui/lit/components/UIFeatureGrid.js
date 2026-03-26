import { LitElement, html, css } from 'lit'
import { icon } from '@nan0web/icons/adapters/lit'
import { FeatureGridModel } from '@nan0web/ui/domain'
import { BsRocketTakeoff, BsCollectionPlay, BsLockFill } from '@nan0web/icons/bs'

const ICON_MAP = {
	'🚀': BsRocketTakeoff,
	'🗺': BsCollectionPlay,
	'🔒': BsLockFill,
}

export class UIFeatureGrid extends LitElement {
	static properties = {
		items: { type: Array },
	}

	static styles = css`
		:host {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 1.5rem;
			padding: 2rem 0;
		}
		.card {
			background: var(--bg-surface);
			padding: 2rem;
			border-radius: 12px;
			border: 1px solid var(--border);
			transition:
				transform 0.2s,
				border-color 0.2s;
			color: var(--text-primary);
		}
		.card:hover {
			transform: translateY(-4px);
			border-color: var(--accent);
		}
		.icon {
			margin-bottom: 1rem;
			color: var(--accent);
		}
		.title {
			font-size: 1.2rem;
			font-weight: bold;
			margin-bottom: 0.5rem;
		}
		.desc {
			color: var(--text-secondary);
			line-height: 1.6;
			font-size: 0.95rem;
		}
	`

	render() {
		const model = new FeatureGridModel({
			items: this.items
		})
		
		return html`
			${model.items.map(
				(item) => html`
					<div class="card">
						<div class="icon">
							${ICON_MAP[item.icon]
								? icon(ICON_MAP[item.icon], { size: 32, color: 'var(--accent)' })
								: item.icon}
						</div>
						<div class="title">${item.title}</div>
						<div class="desc">${item.description}</div>
					</div>
				`,
			)}
		`
	}
}

customElements.define('ui-feature-grid', UIFeatureGrid)
