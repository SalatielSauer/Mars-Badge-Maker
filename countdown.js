const countdown = document.getElementById("countdown");
const launch = new Date("Wed, 30 July 2020 03:50:00 -0800");
const landing = new Date("Thur, 22 Jan 2021 23:59:59 -0800");
const song = new Audio("https://drive.google.com/u/0/uc?id=1Lt9fM76LeASqqiiMmqoQaCGByPqU81i9&export=download");
song.loop = true;

var soundvol = document.createElement("i");
soundvol.id = "soundvol";
soundvol.className = "fas fa-volume-mute";
soundvol.addEventListener("click", ()=>{
	soundvol.className = (song.paused||song.muted) ? "fas fa-volume-down" : "fas fa-volume-mute";
	if (song.paused) {
		playSpecial()
		soundvol.style.color = "#ff9800";
	} else {
		song.pause()
		soundvol.style.color = "#f44336";
	}
})
countdown.after(soundvol)

function playSpecial() {
	if (document.getElementsByTagName("video")[0] == undefined) {
		var video = document.createElement("video");
		video.autoplay = video.muted = video.loop = true; video.src = "https://drive.google.com/u/0/uc?id=1-I2qhrAhD1fj4kx9ekpnRYkmR3IySQKO&export=download";
		document.body.appendChild(video)
	}
	song.play()
}

function autoplaySpecial() {
	if (days==0) {
		playSpecial()
		soundvol.className = "fas fa-volume-down";
		document.removeEventListener("click", autoplaySpecial)
	}
}
document.addEventListener("click", autoplaySpecial)

var today; var days; var daystext;
function startCounter() {
	today = new Date().getTime();
	var distance = landing-today;
	days = Math.floor(distance/(1000*60*60*24));
	daystext = `${Math.abs(days)} ${Math.abs(days)!=1 ? "days" : "day"}`;
	countdown.innerHTML = days<0 ? `we have been persevering on Mars for ${daystext}!`
							: days!=0 ? `${daystext} until landing` : "The landing is today!";

	if (days<=0) {
		document.querySelector("#soundvol").style.display = "unset";
	}
	setInterval(startCounter, 60000)
}
startCounter()

function sharetweet() {
	window.open(`https://twitter.com/intent/tweet?url=https%3A//salatielsauer.github.io/Mars-Badge-Maker&text=Countdown%20to%20Mars! ${countdown.innerText}.%0Dvia @SalatielSauer&related=CountDownToMars,Mars2020,Perseverance`)
}

function writeCountdown(x, y, color) {
	badgecanvasctx.font = "35px Recursive";
	badgecanvasctx.textAlign = "center";
	badgecanvasctx.fillStyle = color;
	var countdownText = days<0 ? `Persevering for ${daystext}!` : countdown.innerText;
	badgecanvasctx.fillText(countdownText, (badgewidth/2-countdownText.length/2)+x, (badgeheight/2)+y)
}