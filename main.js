imageLoader = document.getElementById('fileinput');
imageLoader.addEventListener('change', importImg, false);
badgecanvas = document.getElementById("badgeCanvas");
badgecanvasctx = badgecanvas.getContext("2d");
namefield = document.getElementById("inputtext");
inputarea = document.getElementById("inputarea");

var img = new Image();
var userfile;
var uploadedPhoto;
function importImg(e){
    var reader = new FileReader();
	userfile = e.target.files[0];
	if (userfile){
		reader.onload = function(event){
			img.onload = function(){
				uploadedPhoto = img
				processBadge(curbadge[0], curbadge[1])
			}
			img.src = event.target.result;
		}
		reader.readAsDataURL(e.target.files[0]);
	}
}

badgesdiv = document.getElementById("badges")
badgeslist = ["cdtm1.jpg", "cdtm2.png", "cdtm4.jpg", "cdtm5.png", "cdtm3.png"]
function genBadges() {
	for (b in badgeslist) {
		badgesdiv.innerHTML += "<div class=\"badge\" badgeid=\"" + b + "\"><img class=\"badgePreview\"src=\"badges/" + badgeslist[b] + "\"/>\n\t<div class=\"badgeChecker\" onclick=\"selectBadge(" + b + ")\"><i class=\"far fa-check-circle\"></i></div</div>"
	}
}

genBadges()

var launch = new Date('Wed, 30 July 2020 03:50:00 -0800');
var landing =  new Date('Thur, 18 Feb 2021 12:00:00 -0800');

startCounter = setInterval(function() {
	var today = new Date().getTime();
	var distance = landing - today;

	days = Math.floor(distance / (1000 * 60 * 60 * 24));
	/*hours = Math.floor((distance % (60 * 60 * 1000 * 24)) / (60 * 60 * 1000));
	minutes = Math.floor((distance % (60 * 60 * 1000)) / (60 * 1000));
	seconds = Math.floor((distance % (60 * 1000)) / 1000);
	document.getElementById("countdown").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";*/

	if (days != 0) {
		document.getElementById("countdown").innerHTML = days + " day" + "s".substr(days == 1) + " until landing"
	} else {
		document.getElementById("countdown").innerHTML = "The landing is today!"
	}
}, 1000)

function sharetweet() {
	window.open("https://twitter.com/intent/tweet?url=https%3A//salatielsauer.github.io/Mars-Badge-Maker&text=Countdown%20to%20Mars! " + document.getElementById("countdown").innerText + ".%0Dvia @SalatielSauer&related=CountDownToMars,Mars2020,Perseverance")
}

function selectBadge(id) {
	document.querySelectorAll(".badge").forEach(function(badge) {
	    bid = badge.getAttribute("badgeid")
	    badgeChecker = document.getElementsByClassName("badgeChecker")[bid];
	    if (bid != id) {
	    	badge.style.filter = "grayscale(1)";
	    	badge.style.transform =  "scale(0.9)";
	    	badge.style.borderStyle = "unset";
	    	badgeChecker.style.display = "unset";
	    } else {
	    	badge.style.filter = "unset";
	    	badge.style.transform =  "scale(1)";
	    	badge.style.borderStyle = "inset";
	    	badge.style.borderColor = "red";
	    	badgeChecker.style.display = "none";
	    	processBadge(badge.querySelector("img"), bid)
	    }
	})
}

function writeText(x, y, sizetype, len, color, align) {
	if (namefield.value.length >= len) {
		firstname = namefield.value.substr(0, 20).lastIndexOf(" ");
		splitname.push(namefield.value.substr(0, firstname));
		splitname.push(namefield.value.substr(firstname + 1));
	} else {splitname[0] = namefield.value}
	badgecanvasctx.textAlign = align;
	badgecanvasctx.fillStyle = color;
	badgecanvasctx.font = sizetype;
	if (splitname.length != 1) {y-= 20}
	for (l = 0; l < splitname.length; l++) {
		badgecanvasctx.fillText(splitname[l], x, y + l*40);
	}
}

function drawPhoto(x, y, ratiow, ratioh) {
	if (uploadedPhoto) {
		uphotoratio = calcARatio(uploadedPhoto.width, uploadedPhoto.height, ratiow, ratioh);
		badgecanvasctx.drawImage(uploadedPhoto, x, y, uphotoratio.width, uphotoratio.height)
	}
}

function drawCountDown(x, y, color) {
	/*if (days != 0) {timeremaining = "Launch in " + days + " days!"} else {
		if (hours != 0) {timeremaining = "Only " + hours + " hours until launch!"} else {
			if (minutes != 0) {timeremaining = minutes + " MINUTES!!!"} else {
				timeremaining = "00:00:" + seconds + " BE READY!"
			}
		}
	}*/
	timeremaining = document.getElementById("countdown").innerText;
	badgecanvasctx.font = "25px Recursive";
	badgecanvasctx.fillStyle = color;
	badgecanvasctx.fillText(timeremaining, x, y);
}

function calcARatio(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = Math.min(maxWidth/srcWidth, maxHeight/srcHeight);
    return {width: srcWidth*ratio, height: srcHeight*ratio};
 }

function processBadge(src, id) {
	curbadge = [src, id];
	splitname = [];
	multiplier = 4;
	imgwidth = src.width * multiplier;
	imgheight = src.height * multiplier;
	if (id == 1 || id == 4) {
		badgecanvas.width = imgheight;
		badgecanvas.height = imgwidth;
		badgecanvasctx.save();
		badgecanvasctx.translate(badgecanvas.width/2, badgecanvas.height/2);
		badgecanvasctx.rotate(90*Math.PI/180);
		badgecanvasctx.drawImage(src, -imgwidth/2, -imgheight/2, imgwidth, imgheight);
		badgecanvasctx.restore();
	} else {
		badgecanvas.width = imgwidth;
		badgecanvas.height = imgheight;
		badgecanvasctx.drawImage(src, 0, 0, badgecanvas.width, badgecanvas.height);
	}

	if (id == 0) {
		writeText(500, 670, "50px Lobster", 20, "white", "center")
		drawCountDown(510, 810, "red")
		drawPhoto(imgwidth/2, 200, 325, 325)
	}
	if (id == 1 || id == 4) {
		writeText(imgheight/2-170, imgwidth/2-namefield.value.length, "33px Recursive", 25, "#272727", "left")
	}
	if (id == 2) {
		writeText(imgwidth/2, 670, "50px Lobster", 30, "white", "center")
		drawPhoto(imgwidth/2-350/2, imgheight/2-350+100, 350, 350)
		drawCountDown(imgwidth/2, 725, "white")
	}
	if (id == 3) {
		badgecanvasctx.fillStyle = "black";
		badgecanvasctx.fillRect(0, 0, badgecanvas.width, badgecanvas.height);
		drawPhoto(imgwidth/2-700/2, imgheight/2-700/2-160, 700, 700)
		badgecanvasctx.drawImage(src, 0, 0, badgecanvas.width, badgecanvas.height);
		writeText(35, 95, "35px Recursive", 20, "white", "left")
	}
	inputarea.style.filter = "unset";
	inputarea.style.pointerEvents = "unset";
}

var download = function(){
	var link = document.createElement("a");
	link.download = "Badge-" + namefield.value.replace(/\s/g, "_") + ".png";
	link.href = badgecanvas.toDataURL();
	link.click();
}