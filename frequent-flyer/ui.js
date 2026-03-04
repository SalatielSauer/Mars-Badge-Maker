(function() {
	const STORAGE_KEY = "mars-badge-maker.frequent-flyer-form";
	const RESULTS_STORAGE_KEY = "mars-badge-maker.frequent-flyer-results";
	const MISSION_BADGE_ASSETS = {
		insight: "images/badges/insight.png",
		"mars-2020": "images/badges/mars2020.png",
		"mars-future": "images/badges/futuremarsmission.png",
		"exploration-mission-1": "images/badges/explorationmission1.png",
		"orion-first-flight": "images/badges/orion.png"
	};
	const MISSION_LABELS = {
		"orion-first-flight": "Orion Test Flight",
		insight: "InSight",
		"mars-2020": "Mars 2020",
		"mars-future": "Future Mars Mission",
		"exploration-mission-1": "Artemis 1 (Exploration Mission 1)"
	};
	const section = document.getElementById("frequentFlyerSection");

	if (!section || !window.NFFApi) {
		return;
	}

	const form = document.getElementById("frequentFlyerForm");
	const lastNameInput = document.getElementById("frequentFlyerLastName");
	const emailInput = document.getElementById("frequentFlyerEmail");
	const submitButton = document.getElementById("frequentFlyerSubmit");
	const clearButton = document.getElementById("frequentFlyerClear");
	const status = document.getElementById("frequentFlyerStatus");
	const error = document.getElementById("frequentFlyerError");
	const results = document.getElementById("frequentFlyerResults");
	let currentPayload = null;
	let hideIdentity = false;

	restoreFormState();

	form.addEventListener("input", persistFormState);
	form.addEventListener("submit", async function(event) {
		event.preventDefault();
		await search();
	});

		clearButton.addEventListener("click", function() {
			lastNameInput.value = "";
			emailInput.value = "";
			localStorage.removeItem(STORAGE_KEY);
			localStorage.removeItem(RESULTS_STORAGE_KEY);
			currentPayload = null;
			hideIdentity = false;
			status.textContent = "Ready";
			setBusy(false);
			renderError("");
			renderEmpty("Search with the passenger's last name and email to load their mission profile.");
		});

	async function search() {
		const lastName = lastNameInput.value.trim();
		const email = emailInput.value.trim();

		if (!lastName || !email) {
			renderError("Enter both last name and email.");
			return;
		}

		setBusy(true);
		renderError("");

		try {
			const payload = await window.NFFApi.searchByIdentity(lastName, email);
				currentPayload = payload;
				hideIdentity = false;
				persistResultsState();
				renderResults(payload);
				applyPassengerToBadge(getPassengerName(payload, payload.flights || []));
				status.textContent = "Profile loaded";
			} catch (requestError) {
				currentPayload = null;
				localStorage.removeItem(RESULTS_STORAGE_KEY);
				renderEmpty("No profile data loaded.");
				renderError(formatError(requestError));
				status.textContent = "Request failed";
		} finally {
			setBusy(false);
		}
	}

	function setBusy(isBusy) {
		submitButton.disabled = isBusy;
		clearButton.disabled = isBusy;
		lastNameInput.disabled = isBusy;
		emailInput.disabled = isBusy;
		status.textContent = isBusy ? "Loading NASA data..." : status.textContent;
	}

	function renderResults(payload) {
		const flights = Array.isArray(payload && payload.flights) ? payload.flights.slice() : [];
		if (!flights.length) {
			renderEmpty("NASA returned a response, but there were no mission records in it.");
			return;
		}

		flights.sort(function(left, right) {
			return Number(left.date_created || 0) - Number(right.date_created || 0);
		});

		const summary = summarizeFlights(flights);
		const passenger = getPassengerName(payload, flights);
		const displayPassenger = passenger || "Unknown passenger";
		const userId = getUserId(payload, flights);

		results.innerHTML = `
			<section class="frequent-flyer-hero">
				<div class="frequent-flyer-hero-copy">
					<div class="frequent-flyer-kicker">${escapeHtml(summary.firstDate ? `Martian since ${summary.firstDate}` : "Frequent flyer profile")}</div>
						<div class="frequent-flyer-identity-row">
							<h3 class="${hideIdentity ? "frequent-flyer-name-hidden" : ""}">${escapeHtml(displayPassenger)}</h3>
						<button class="frequent-flyer-eye" type="button" data-action="toggle-identity" aria-label="${hideIdentity ? "Show identity" : "Hide identity"}" title="${hideIdentity ? "Show identity" : "Hide identity"}">${renderEyeIcon(hideIdentity)}</button>
					</div>
					<p>${summary.count} mission${summary.count === 1 ? "" : "s"} found across ${summary.uniqueMissionCount} unique badge${summary.uniqueMissionCount === 1 ? "" : "s"}.</p>
				</div>
				<div class="frequent-flyer-summary-grid">
					<article>
						<span>Flights</span>
						<strong>${summary.count}</strong>
					</article>
					<article>
						<span>First Mission</span>
						<strong>${escapeHtml(summary.firstMission || "n/a")}</strong>
					</article>
					<article>
						<span>Latest Mission</span>
						<strong>${escapeHtml(summary.latestMission || "n/a")}</strong>
					</article>
				</div>
			</section>
			<section class="frequent-flyer-card">
				<h3>Mission History</h3>
					<p class="frequent-flyer-card-note">This passenger’s name is on board these missions:</p>
				<div class="frequent-flyer-mission-grid">
					${flights.map(renderMissionCard).join("")}
				</div>
			</section>
			<section class="frequent-flyer-card">
				<h3>Mission Details</h3>
				<p class="frequent-flyer-card-note">NASA ID: <span class="frequent-flyer-code">${escapeHtml(hideIdentity ? maskIdentifier(userId) : userId || "n/a")}</span></p>
				<div class="frequent-flyer-table-wrap">
					<table class="frequent-flyer-table">
						<thead>
							<tr>
								<th>Badge</th>
								<th>Mission</th>
								<th>Joined</th>
								<th>Status</th>
								<th>Cert ID</th>
							</tr>
						</thead>
						<tbody>
							${flights.map(function(flight) { return renderTableRow(flight, hideIdentity); }).join("")}
						</tbody>
					</table>
				</div>
			</section>
			<details class="frequent-flyer-card frequent-flyer-raw">
				<summary>Raw API Payload</summary>
				<pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
			</details>
		`;
	}

	function renderMissionCard(flight) {
		const mission = getMissionLabel(flight.mission || "unknown");
		const statusLabel = flight.status_label || String(flight.status || "n/a");
		const certId = flight.cert_id ? String(flight.cert_id) : "";
		const certLink = certId ? `https://mars.nasa.gov/syn-mars/certificates/${encodeURIComponent(certId)}` : "";
		const badgeImage = getMissionBadgeImage(flight.mission);
		const badgeMedia = badgeImage
			? `<img class="frequent-flyer-mission-image" src="${badgeImage}" alt="${escapeHtml(mission)} mission badge">`
			: `<div class="frequent-flyer-mission-mark">${escapeHtml(getMissionMark(mission))}</div>`;

		return `
			<article class="frequent-flyer-mission-card">
				<div class="frequent-flyer-mission-media">${badgeMedia}</div>
				<div class="frequent-flyer-mission-copy">
					<h4>${escapeHtml(mission)}</h4>
					<p>${escapeHtml(formatUnixDate(flight.date_created) || "Unknown date")}</p>
					<span class="frequent-flyer-chip">${escapeHtml(statusLabel)}</span>
					${certLink ? `<a href="${certLink}" target="_blank" rel="noreferrer">Open certificate JSON</a>` : `<span class="frequent-flyer-muted">No certificate link</span>`}
				</div>
			</article>
		`;
	}

	function renderTableRow(flight, shouldHideIdentity) {
		return `
			<tr>
				<td class="frequent-flyer-table-badge-cell">${renderTableBadge(flight)}</td>
				<td>${escapeHtml(getMissionLabel(flight.mission || "unknown"))}</td>
				<td>${escapeHtml(formatUnixDate(flight.date_created) || "n/a")}</td>
				<td>${escapeHtml(flight.status_label || String(flight.status || "n/a"))}</td>
				<td class="frequent-flyer-code">${escapeHtml(formatIdentifier(flight.cert_id, shouldHideIdentity))}</td>
			</tr>
		`;
	}

	function renderEmpty(message) {
		results.innerHTML = `<div class="frequent-flyer-empty">${escapeHtml(message)}</div>`;
	}

	results.addEventListener("click", function(event) {
		const actionButton = event.target && event.target.closest ? event.target.closest("[data-action='toggle-identity']") : null;
			if (actionButton) {
				hideIdentity = !hideIdentity;
				persistResultsState();
				if (currentPayload) {
					renderResults(currentPayload);
				}
			}
		});

	function renderError(message) {
		error.hidden = !message;
		error.textContent = message || "";
	}

	function summarizeFlights(flights) {
		const uniqueMissions = [];
		const seenMissions = {};

		flights.forEach(function(flight) {
			if (!flight.mission || seenMissions[flight.mission]) {
				return;
			}
			seenMissions[flight.mission] = true;
			uniqueMissions.push(flight.mission);
		});

		return {
			count: flights.length,
			uniqueMissionCount: uniqueMissions.length,
			firstDate: formatUnixDate(flights[0].date_created),
			firstMission: getMissionLabel(flights[0].mission || ""),
			latestMission: getMissionLabel(flights[flights.length - 1].mission || "")
		};
	}

	function getPassengerName(payload, flights) {
		const search = payload && payload.search;
		const firstFlight = flights[0] || {};
		const source = Array.isArray(search) ? search[0] || {} : search || payload.certificate || firstFlight;
		return [source.first_name, source.last_name].filter(Boolean).join(" ");
	}

	function getUserId(payload, flights) {
		const search = payload && payload.search;
		const firstFlight = flights[0] || {};
		const source = Array.isArray(search) ? search[0] || {} : search || payload.certificate || firstFlight;
		return source.user_id || firstFlight.user_id || "";
	}

	function applyPassengerToBadge(passengerName) {
		const trimmedName = String(passengerName || "").trim().slice(0, 32);
		const badgeNameInput = document.getElementById("inputtext");
		if (!trimmedName || !badgeNameInput) {
			return;
		}

		badgeNameInput.value = trimmedName;
		localStorage.setItem("namefield", trimmedName);

		if (typeof window.selectBadge === "function" && window.curbadge && typeof window.curbadge[1] !== "undefined") {
			window.selectBadge(window.curbadge[1]);
		} else if (typeof window.processBadge === "function" && window.curbadge && window.curbadge[0] && typeof window.curbadge[1] !== "undefined") {
			window.processBadge(window.curbadge[0], window.curbadge[1]);
		}
	}

	function formatUnixDate(unixSeconds) {
		if (!unixSeconds) {
			return "";
		}

		const date = new Date(Number(unixSeconds) * 1000);
		if (Number.isNaN(date.getTime())) {
			return "";
		}

		return new Intl.DateTimeFormat("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric"
		}).format(date);
	}

	function humanizeMissionName(mission) {
		return String(mission || "")
			replace(/[-_]+/g, " ")
			replace(/\b\w/g, function(letter) {
				return letter.toUpperCase();
			});
	}

	function getMissionLabel(missionKey) {
		const normalizedKey = String(missionKey || "").toLowerCase();
		return MISSION_LABELS[normalizedKey] || humanizeMissionName(missionKey);
	}

	function getMissionMark(mission) {
		return mission
			.split(" ")
			filter(Boolean)
			slice(0, 2)
			.map(function(word) {
				return word.charAt(0).toUpperCase();
			})
			.join("") || "M";
	}

	function getMissionBadgeImage(missionKey) {
		return MISSION_BADGE_ASSETS[String(missionKey || "").toLowerCase()] || "";
	}

	function renderTableBadge(flight) {
		const mission = humanizeMissionName(flight.mission || "unknown");
		const badgeImage = getMissionBadgeImage(flight.mission);
		if (badgeImage) {
			return `<img class="frequent-flyer-table-badge" src="${badgeImage}" alt="${escapeHtml(mission)} mission badge">`;
		}
		return `<span class="frequent-flyer-table-badge-fallback">${escapeHtml(getMissionMark(mission))}</span>`;
	}

	function escapeHtml(value) {
		return String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function escapeHtmlAttribute(value) {
		return escapeHtml(value);
	}

	function formatIdentifier(value, shouldHideIdentity) {
		const normalized = value ? String(value) : "n/a";
		return shouldHideIdentity ? maskIdentifier(normalized) : normalized;
	}

	function maskIdentifier(value) {
		if (!value || value === "n/a") {
			return "n/a";
		}
		return "*".repeat(String(value).length);
	}

	function renderEyeIcon(isHidden) {
		if (isHidden) {
			return `
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M3 3l18 18" />
					<path d="M10.6 10.7a2 2 0 002.7 2.7" />
					<path d="M9.9 5.1A10.9 10.9 0 0112 5c5 0 9.3 3.1 11 7-1 2.4-2.8 4.4-5 5.7" />
					<path d="M6.6 6.7C4.6 8 3 9.8 1 12c.7 1.7 1.8 3.3 3.3 4.6" />
				</svg>
			`;
		}

		return `
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
		`;
	}

	function formatError(requestError) {
		if (requestError && requestError.status) {
			return `NASA request failed with status ${requestError.status}.`;
		}
		return requestError && requestError.message ? requestError.message : "NASA request failed.";
	}

	function persistFormState() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			lastName: lastNameInput.value,
			email: emailInput.value
		}));
	}

	function persistResultsState() {
		if (!currentPayload) {
			localStorage.removeItem(RESULTS_STORAGE_KEY);
			return;
		}

		localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify({
			payload: currentPayload,
			hideIdentity: hideIdentity
		}));
	}

	function restoreFormState() {
		try {
			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
			lastNameInput.value = stored.lastName || "";
			emailInput.value = stored.email || "";
		} catch (_error) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	restoreResultsState();

	function restoreResultsState() {
		try {
			const stored = JSON.parse(localStorage.getItem(RESULTS_STORAGE_KEY) || "null");
			if (!stored || !stored.payload) {
				return;
			}

			currentPayload = stored.payload;
			hideIdentity = Boolean(stored.hideIdentity);
			renderResults(currentPayload);
			status.textContent = "Restored saved profile";
		} catch (_error) {
			localStorage.removeItem(RESULTS_STORAGE_KEY);
		}
	}
})();
