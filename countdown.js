const countdown = document.getElementById("countdown");
const launch = new Date("Wed, 30 July 2020 03:50:00 -0800");
const landing = new Date("Thur, 18 Feb 2021 23:59:59 -0800");
const song = new Audio("media/life-on-mars-instrumental.mp3");
song.loop = true;
song.preload = "auto";

let video;

function updateSoundIcon() {
	soundvol.className = song.paused ? "fas fa-volume-mute" : "fas fa-volume-down";
}

function ensureBackgroundVideo() {
	if (video) {
		return video;
	}

	video = document.createElement("video");
	video.autoplay = true;
	video.defaultMuted = true;
	video.loop = true;
	video.muted = true;
	video.playsInline = true;
	video.preload = "auto";
	video.id = "background-video";
	video.src = "media/perseverance-rover-landing-animation.mp4";
	video.setAttribute("muted", "");
	video.setAttribute("playsinline", "");
	document.body.appendChild(video);
	return video;
}

function pauseSpecial() {
	song.pause();
	soundvol.style.color = "#f44336";
	updateSoundIcon();
}

var soundvol = document.createElement("i");
soundvol.id = "soundvol";
soundvol.className = "fas fa-volume-mute";
soundvol.addEventListener("click", async ()=>{
	if (song.paused) {
		await playSpecial();
	} else {
		pauseSpecial();
	}
});
countdown.after(soundvol);

async function playSpecial() {
	const backgroundVideo = ensureBackgroundVideo();

	try {
		await backgroundVideo.play();
	} catch (error) {
		console.error("Background video playback failed.", error);
	}

	try {
		await song.play();
		soundvol.style.color = "#ff9800";
	} catch (error) {
		console.error("Song playback failed.", error);
		soundvol.style.color = "#f44336";
	}

	updateSoundIcon();
}

function autoplaySpecial() {
	if (days <= 0) {
		playSpecial();
		document.removeEventListener("click", autoplaySpecial);
	}
}
document.addEventListener("click", autoplaySpecial);

var today; var days; var daystext;
const EARTH_DAY_IN_MS = 1000 * 60 * 60 * 24;
const MARS_SOL_IN_EARTH_DAYS = 1.02749125;
const MARS_YEAR_IN_SOLS = 668.6;

function formatCount(value, maximumFractionDigits) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits
	}).format(value);
}

function formatUnit(value, singular, plural, maximumFractionDigits = 0) {
	return `${formatCount(value, maximumFractionDigits)} ${value === 1 ? singular : plural}`;
}

function formatYearsAndMonths(totalYears, yearSingular, yearPlural, monthSingular, monthPlural) {
	const totalMonths = Math.floor(totalYears * 12);
	const years = Math.floor(totalMonths / 12);
	const months = totalMonths % 12;
	const parts = [];

	if (years > 0) {
		parts.push(formatUnit(years, yearSingular, yearPlural));
	}

	if (months > 0 || years === 0) {
		parts.push(formatUnit(months, monthSingular, monthPlural));
	}

	return parts.join(years > 0 && months > 0 ? " and " : "");
}

function getElapsedTimeBreakdown() {
	const elapsedEarthDays = Math.floor((today - landing.getTime()) / EARTH_DAY_IN_MS);
	const elapsedMarsSols = Math.floor(elapsedEarthDays / MARS_SOL_IN_EARTH_DAYS);
	const elapsedMarsYears = elapsedMarsSols / MARS_YEAR_IN_SOLS;
	const elapsedEarthYears = elapsedEarthDays / 365.25;

	return {
		elapsedEarthDays,
		elapsedEarthYears,
		elapsedMarsSols,
		elapsedMarsYears
	};
}

function startCounter() {
	today = new Date().getTime();
	var distance = landing-today;
	days = Math.floor(distance / EARTH_DAY_IN_MS);
	daystext = `${Math.abs(days)} ${Math.abs(days)!=1 ? "days" : "day"}`;
	if (days < 0) {
		const elapsed = getElapsedTimeBreakdown();
		const marsDayText = formatUnit(elapsed.elapsedMarsSols, "Mars day", "Mars days");
		const marsYearText = formatYearsAndMonths(elapsed.elapsedMarsYears, "year", "years", "month", "months");
		const earthDayText = formatUnit(elapsed.elapsedEarthDays, "day", "days");
		const earthYearText = formatYearsAndMonths(elapsed.elapsedEarthYears, "year", "years", "month", "months");

		countdown.innerHTML = `we have been persevering for ${marsDayText}!<span class="countdown-equivalent">On Mars, that's equivalent to ${marsYearText}. On Earth, that's ${earthYearText}, or ${earthDayText}.</span>`;
	} else {
		countdown.textContent = days!=0 ? `${daystext} until landing` : "The landing is today!";
	}

	if (days<=0) {
		document.querySelector("#soundvol").style.display = "unset";
	}
}
startCounter();
setInterval(startCounter, 60000);

function sharetweet() {
	window.open(`https://twitter.com/intent/tweet?url=https%3A//salatielsauer.github.io/Mars-Badge-Maker&text=Countdown%20to%20Mars! ${countdown.innerText}.%0Dvia @SalatielSauer&related=CountDownToMars,Mars2020,Perseverance`)
}

function writeCountdown(x, y, color) {
	badgecanvasctx.font = "35px Recursive";
	badgecanvasctx.textAlign = "center";
	badgecanvasctx.fillStyle = color;
	var countdownText = days < 0
		? `Persevering for ${formatUnit(getElapsedTimeBreakdown().elapsedMarsSols, "Mars day", "Mars days")}!`
		: countdown.innerText;
	badgecanvasctx.fillText(countdownText, (badgewidth/2-countdownText.length/2)+x, (badgeheight/2)+y)
}
