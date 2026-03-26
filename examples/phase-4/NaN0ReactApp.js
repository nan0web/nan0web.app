import React, { useState, useEffect } from 'react'

/**
 * NaN0Web Hook for React.
 * Seamlessly connects React components to the WebSocket state.
 */
export function useNaN0State() {
	const [state, setState] = useState({})

	useEffect(() => {
		const handleUpdate = (event) => {
			setState(event.detail)
		}

		// Initial connection: wait for nan0-state-change
		window.addEventListener('nan0-state-change', handleUpdate)
		
		return () => {
			window.removeEventListener('nan0-state-change', handleUpdate)
		}
	}, [])

	return state
}

/**
 * Example React Component.
 */
export function NaN0ReactApp() {
	const state = useNaN0State()

	if (!state.title) return <p>Connecting to NaN0Bridge...</p>

	return (
		<div style={{ border: '2px solid blue', padding: '10px' }}>
			<h1>{state.title} (React)</h1>
			<p>State Key: {state.key || 'no key defined'}</p>
			<pre>{JSON.stringify(state, null, 2)}</pre>
		</div>
	)
}

export default NaN0ReactApp
