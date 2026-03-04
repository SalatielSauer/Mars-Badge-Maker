(function() {
	const API_BASE = "https://mars.nasa.gov/rss/api/";
	const DEFAULT_PARAMS = {
		feed: "raw_images",
		category: "mars2020,ingenuity",
		feedtype: "json",
		ver: "1.2"
	};

	async function fetchLatestSummary() {
		return fetchJson(buildUrl({
			latest: "true"
		}));
	}

	async function fetchImages(options) {
		const settings = options || {};
		const params = {
			num: String(settings.num || 8),
			page: String(settings.page || 0),
			order: settings.order || "sol desc",
			condition_1: "mars2020:mission"
		};

		if (typeof settings.sol === "number" && !Number.isNaN(settings.sol)) {
			params.condition_2 = `${settings.sol}:sol:in`;
		}

		return fetchJson(buildUrl(params));
	}

	function buildUrl(extraParams) {
		const params = new URLSearchParams(DEFAULT_PARAMS);
		Object.keys(extraParams || {}).forEach(function(key) {
			if (extraParams[key] !== undefined && extraParams[key] !== null && extraParams[key] !== "") {
				params.set(key, extraParams[key]);
			}
		});
		return `${API_BASE}?${params.toString()}`;
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

	window.MarsRawImagesApi = {
		fetchLatestSummary: fetchLatestSummary,
		fetchImages: fetchImages
	};
})();
