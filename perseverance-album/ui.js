(function() {
	const MAX_IMAGES = 8;
	const section = document.getElementById("perseveranceAlbumSection");

	if (!section || !window.MarsRawImagesApi) {
		return;
	}

	const status = document.getElementById("perseveranceAlbumStatus");
	const error = document.getElementById("perseveranceAlbumError");
	const results = document.getElementById("perseveranceAlbumResults");
	const latestButton = document.getElementById("perseveranceAlbumLatest");
	const modal = document.getElementById("perseveranceAlbumModal");
	const modalClose = document.getElementById("perseveranceAlbumModalClose");
	const modalImage = document.getElementById("perseveranceAlbumModalImage");
	const modalInstrument = document.getElementById("perseveranceAlbumModalInstrument");
	const modalSol = document.getElementById("perseveranceAlbumModalSol");
	const modalTitle = document.getElementById("perseveranceAlbumModalTitle");
	const modalDescription = document.getElementById("perseveranceAlbumModalDescription");
	const modalDate = document.getElementById("perseveranceAlbumModalDate");
	const modalLink = document.getElementById("perseveranceAlbumModalLink");

	const state = {
		latestSol: null,
		latestDate: "",
		loading: false,
		images: []
	};

	latestButton.addEventListener("click", function() {
		loadLatestAlbum(true);
	});

	results.addEventListener("click", function(event) {
		const trigger = event.target && event.target.closest ? event.target.closest("[data-image-index]") : null;
		if (!trigger) {
			return;
		}

		event.preventDefault();
		openModal(Number(trigger.getAttribute("data-image-index")));
	});

	if (modal) {
		modal.addEventListener("click", function(event) {
			const closeTrigger = event.target && event.target.closest ? event.target.closest("[data-action='close-modal']") : null;
			if (closeTrigger) {
				closeModal();
			}
		});
	}

	if (modalClose) {
		modalClose.addEventListener("click", closeModal);
	}

	document.addEventListener("keydown", function(event) {
		if (event.key === "Escape" && modal && !modal.hidden) {
			closeModal();
		}
	});

	loadLatestAlbum(false);

	async function loadLatestAlbum(fromRefresh) {
		setBusy(true, fromRefresh ? "Requesting a fresh rover downlink..." : "Opening the rover downlink...");
		renderError("");

		try {
			const latestSummary = await window.MarsRawImagesApi.fetchLatestSummary();
			const latestSol = getLatestSol(latestSummary);
			const latestDate = formatDate(latestSummary && latestSummary.latest);

			if (latestSol === null) {
				throw new Error("NASA did not return a latest Perseverance sol.");
			}

			state.latestSol = latestSol;
			state.latestDate = latestDate;

			const payload = await window.MarsRawImagesApi.fetchImages({
				sol: latestSol,
				num: MAX_IMAGES,
				page: 0
			});
			const images = normalizeImages(payload);

			if (!images.length) {
				throw new Error(`NASA returned no raw images for Sol ${latestSol}.`);
			}

			state.images = images;
			renderAlbum(images);
			status.textContent = latestDate
				? `Latest rover downlink locked: Sol ${latestSol} • relay stamped ${latestDate}`
				: `Latest rover downlink locked: Sol ${latestSol}`;
		} catch (requestError) {
			renderError(formatError(requestError));
			renderEmpty("The rover image relay did not answer cleanly. Try the downlink again.");
			status.textContent = "Rover image relay unavailable";
		} finally {
			setBusy(false);
		}
	}

	function renderAlbum(images) {
		const heroImage = images[0];
		const captureDate = formatDate(heroImage.date_received || heroImage.date_taken_utc);
		const sol = heroImage.sol;
		const subtitleParts = [];

		if (captureDate) {
			subtitleParts.push(captureDate);
		}
		if (images.length) {
			subtitleParts.push(`${images.length} frame${images.length === 1 ? "" : "s"} received`);
		}

		results.innerHTML = `
			<section class="perseverance-album-hero">
				<div>
					<div class="perseverance-album-kicker">Latest rover downlink</div>
					<h3>Today's transmission</h3>
					<p>${escapeHtml(subtitleParts.join(" • ") || "Perseverance image transmission ready")}</p>
				</div>
				<div class="perseverance-album-summary">
					<article>
						<span>Current Sol</span>
						<strong>${escapeHtml(String(sol))}</strong>
					</article>
					<article>
						<span>Frames Pulled</span>
						<strong>${escapeHtml(String(images.length))}</strong>
					</article>
					<article>
						<span>Relay Status</span>
						<strong>Signal Acquired</strong>
					</article>
				</div>
			</section>
			<div class="perseverance-album-grid">
				${images.map(renderImageCard).join("")}
			</div>
		`;
	}

	function renderImageCard(image, index) {
		const imageUrl = getBestImageUrl(image);
		const instrument = image.camera && image.camera.instrument ? image.camera.instrument : "Unknown instrument";
		const title = image.title || instrument;
		const captureDate = formatDate(image.date_taken_utc || image.date_received);
		const description = image.caption || "";

		return `
			<article class="perseverance-album-card">
				<a class="perseverance-album-image-link" href="#" data-image-index="${index}">
					${imageUrl ? `<img class="perseverance-album-image" src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(title)}">` : `<div class="perseverance-album-image-fallback">No preview</div>`}
				</a>
				<div class="perseverance-album-card-copy">
					<div class="perseverance-album-card-topline">
						<span>${escapeHtml(instrument)}</span>
						<span>Sol ${escapeHtml(String(image.sol || "n/a"))}</span>
					</div>
					<h4>${escapeHtml(title)}</h4>
					<p>${escapeHtml(truncate(description, 180) || "Tap to inspect the latest frame in the onboard viewer.")}</p>
					<div class="perseverance-album-card-footer">
						<span>${escapeHtml(captureDate || "Unknown date")}</span>
						<a href="#" data-image-index="${index}">View large</a>
					</div>
				</div>
			</article>
		`;
	}

	function openModal(index) {
		const image = state.images[index];
		if (!image || !modal) {
			return;
		}

		const imageUrl = image.image_files && (image.image_files.full_res || image.image_files.large || image.image_files.medium || image.image_files.small) || "";
		const nasaUrl = image.link || image.json_link || imageUrl || "#";
		const instrument = image.camera && image.camera.instrument ? image.camera.instrument : "Unknown instrument";
		const title = image.title || instrument;
		const description = image.caption || "No caption returned for this frame.";

		modal.hidden = false;
		document.body.classList.add("perseverance-album-modal-open");
		modalImage.src = imageUrl;
		modalImage.alt = title;
		modalInstrument.textContent = instrument;
		modalSol.textContent = `Sol ${image.sol || "n/a"}`;
		modalTitle.textContent = title;
		modalDescription.textContent = description;
		modalDate.textContent = formatDate(image.date_taken_utc || image.date_received) || "Unknown date";
		modalLink.href = nasaUrl;
	}

	function closeModal() {
		if (!modal) {
			return;
		}

		modal.hidden = true;
		document.body.classList.remove("perseverance-album-modal-open");
		modalImage.src = "";
		modalImage.alt = "";
	}

	function renderEmpty(message) {
		results.innerHTML = `<div class="perseverance-album-empty">${escapeHtml(message)}</div>`;
	}

	function renderError(message) {
		error.hidden = !message;
		error.textContent = message || "";
	}

	function setBusy(isBusy, nextStatus) {
		state.loading = isBusy;
		latestButton.disabled = isBusy;
		if (nextStatus) {
			status.textContent = nextStatus;
		}
	}

	function normalizeImages(payload) {
		return Array.isArray(payload && payload.images) ? payload.images : [];
	}

	function getLatestSol(payload) {
		if (payload && typeof payload.latest_sol === "number") {
			return payload.latest_sol;
		}
		if (payload && payload.latest_sol !== undefined) {
			const parsed = Number(payload.latest_sol);
			if (!Number.isNaN(parsed)) {
				return parsed;
			}
		}
		if (Array.isArray(payload && payload.latest_sols) && payload.latest_sols.length) {
			const parsed = payload.latest_sols.map(Number).filter(function(item) {
				return !Number.isNaN(item);
			});
			if (parsed.length) {
				return Math.max.apply(Math, parsed);
			}
		}
		return null;
	}

	function getBestImageUrl(image) {
		const files = image && image.image_files;
		if (!files) {
			return "";
		}
		return files.large || files.medium || files.small || files.full_res || "";
	}

	function truncate(value, maxLength) {
		const text = String(value || "").trim().replace(/\s+/g, " ");
		if (text.length <= maxLength) {
			return text;
		}
		return `${text.slice(0, maxLength - 1).trimEnd()}...`;
	}

	function formatDate(value) {
		if (!value) {
			return "";
		}
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return "";
		}
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric"
		}).format(date);
	}

	function escapeHtml(value) {
		return String(value || "")
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function escapeAttribute(value) {
		return escapeHtml(value);
	}

	function formatError(requestError) {
		if (requestError && requestError.status) {
			return `The rover image relay answered with status ${requestError.status}.`;
		}
		return requestError && requestError.message ? requestError.message : "The rover image relay failed.";
	}
})();
