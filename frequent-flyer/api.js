(function() {
	const API_BASE = "https://mars.nasa.gov/syn-mars";

	async function searchByIdentity(lastName, email) {
		const params = new URLSearchParams({
			last_name: lastName,
			email: email
		});
		const searchResult = await fetchJson(`${API_BASE}/frequent-flyers/search?${params.toString()}`);
		const payload = unwrapPayload(searchResult);

		if (payload && payload.user_id) {
			return lookupByUserId(payload.user_id, payload);
		}

		if (payload && payload.cert_id) {
			return lookupByCertificate(payload.cert_id, payload);
		}

		if (Array.isArray(payload)) {
			const firstMatch = payload.find((item) => item && (item.user_id || item.cert_id));
			if (firstMatch && firstMatch.user_id) {
				return lookupByUserId(firstMatch.user_id, payload);
			}
			if (firstMatch && firstMatch.cert_id) {
				return lookupByCertificate(firstMatch.cert_id, payload);
			}
		}

		return {
			mode: "search",
			search: payload,
			flights: normalizeFlights(payload)
		};
	}

	async function lookupByUserId(userId, searchPayload) {
		const account = await fetchJson(`${API_BASE}/frequent-flyers/account/${encodeURIComponent(userId)}`);
		return {
			mode: "search",
			search: searchPayload || null,
			flights: normalizeFlights(unwrapPayload(account))
		};
	}

	async function lookupByCertificate(certId, searchPayload) {
		const certificate = await fetchJson(`${API_BASE}/certificates/${encodeURIComponent(certId)}`);
		const certPayload = unwrapPayload(certificate);

		if (!certPayload || !certPayload.user_id) {
			return {
				mode: "search",
				search: searchPayload || null,
				certificate: certPayload || null,
				flights: certPayload ? [certPayload] : []
			};
		}

		const account = await fetchJson(`${API_BASE}/frequent-flyers/account/${encodeURIComponent(certPayload.user_id)}`);
		return {
			mode: "search",
			search: searchPayload || null,
			certificate: certPayload,
			flights: normalizeFlights(unwrapPayload(account))
		};
	}

	async function fetchJson(url) {
		const response = await fetch(url, { method: "GET" });
		const bodyText = await response.text();
		let body;

		try {
			body = bodyText ? JSON.parse(bodyText) : null;
		} catch (_error) {
			body = bodyText;
		}

		if (!response.ok) {
			const error = new Error(`NASA request failed with status ${response.status}`);
			error.status = response.status;
			error.body = body;
			throw error;
		}

		return body;
	}

	function unwrapPayload(response) {
		if (response && typeof response === "object" && "payload" in response) {
			return response.payload;
		}
		return response;
	}

	function normalizeFlights(payload) {
		if (Array.isArray(payload && payload.flights)) {
			return payload.flights;
		}
		if (Array.isArray(payload)) {
			return payload;
		}
		if (payload) {
			return [payload];
		}
		return [];
	}

	window.NFFApi = {
		searchByIdentity
	};
})();
