const imageLoader = document.getElementById('fileinput');
imageLoader.addEventListener('change', importImg, false)
const badgecanvas = document.getElementById("badgeCanvas");
const badgecanvasctx = badgecanvas.getContext("2d");
const namefield = document.getElementById("inputtext");
const inputarea = document.getElementById("inputarea");

var uploadedPhoto = new Image();
var userfile;
var uploadedPhoto;
function importImg(e) {
	var reader = new FileReader();
	userfile = e.target.files[0];
	if (userfile) {
		var imagename = document.getElementById("imagename");
		reader.onprogress = e=> {imagename.innerText = `loading (${Math.round((e.loaded/e.total)*100)}%)..`};
		reader.onload = e=> {
			imagename.innerText = "applying photo..";
			uploadedPhoto.onload = function() {
				processBadge(curbadge[0], curbadge[1])
				selectBadge(curbadge[1])
				imagename.innerText = `(${userfile.name.length >= 15 ? `${userfile.name.substr(0, 8)}..${userfile.name.substr(userfile.name.length - 4)}` : userfile.name})`;
			}
			uploadedPhoto.src = e.target.result;
		}
		reader.readAsDataURL(e.target.files[0]);
	}
}

// reads badgeslist and creates a div with the content
var badgesdiv = document.getElementById("badges");
function genBadges() {
	for (var b in badgeslist) {
		badgesdiv.innerHTML +=
			`<div class="badge" badgeid="${b}" id="badge${b}">\
				<img class="badgePreview" src="images/${badgeslist[b].file}"/>\n\t\
				<img class="badgePreview" src="" style="filter: unset; display: none;"/>\n\
				<div class="badgeChecker" onclick="selectBadge(${b})">\
					<i class="far fa-check-circle" style="position: relative; top: 74px;"></i>\
				</div\
			</div>`;
	}
}
genBadges()

var currentURL = window.location.href;
window.onload = ()=>{
	namefield.value = localStorage.getItem("namefield");
	selectBadge(currentURL.includes("#badge") ? currentURL.substr(currentURL.indexOf("#badge")+6, 1) : 0)
}
var previd = -1;
function selectBadge(id) {
	var badge = document.getElementsByClassName("badge");

	window.location.href = `${currentURL.substr(0, currentURL.indexOf("#"))}#badge${id}`;

	// previous preview
	if (previd != -1) {
		var oldpreview = badge[previd].getElementsByTagName("img");
		oldpreview[0].style.display = "unset";
		oldpreview[1].style.display = "none";
		badge[previd].style.filter = "grayscale(1)";
		badge[previd].style.transform =  "scale(0.9)";
		badge[previd].style.borderStyle = "unset";
		badge[previd].getElementsByClassName("badgeChecker")[0].firstElementChild.className = "far fa-check-circle";
	}
	previd = id;

	// current preview
	var curpreview = badge[id].getElementsByTagName("img");
	badge[id].style.filter = "unset";
	badge[id].style.transform =  "scale(1)";
	badge[id].style.borderStyle = "inset";
	badge[id].style.borderColor = "red";
	badge[id].getElementsByClassName("badgeChecker")[0].firstElementChild.className = "fas fa-sync";
	processBadge(curpreview[0], id)
	curpreview[0].style.display = "none";
	curpreview[1].src = badgecanvas.toDataURL("image/jpeg", 0.3)
	curpreview[1].style.display = "unset";
}

function writeText(x, y, sizetype, len, spacing, color, align) {
	localStorage.setItem("namefield", namefield.value);
	if (namefield.value.length >= len) {
		var firstname = namefield.value.substr(0, 20).lastIndexOf(" ");
		splitname.push(namefield.value.substr(0, firstname))
		splitname.push(namefield.value.substr(firstname + 1))
	} else {splitname[0] = namefield.value}
	badgecanvasctx.textAlign = align;
	badgecanvasctx.fillStyle = color;
	badgecanvasctx.font = sizetype;
	y = splitname.length!=1 ? y-=20 : y;
	//if (splitname.length != 1) {y-= 20}
	for (var l = 0; l < splitname.length; l++) {
		badgecanvasctx.fillText(splitname[l], x, y + l*(40+spacing))
	}
}

function drawPhoto(x, y, ratiow, ratioh) {
	if (uploadedPhoto) {
		var uphotoratio = calcARatio(uploadedPhoto.width, uploadedPhoto.height, ratiow, ratioh);
		
		// force center and receive parameters as additions
		var x = (badgewidth/2-uphotoratio.width/2)+x;
		var y = (badgeheight/2-uphotoratio.height/2)+y;
		
		badgecanvasctx.drawImage(uploadedPhoto, x, y, uphotoratio.width, uphotoratio.height)
	}
}

function addOverlay(src, func) {
	badgecanvasctx.filter = 'blur(20px)';
	badgecanvasctx.drawImage(uploadedPhoto, 0, 0, badgecanvas.width, badgecanvas.height)
	badgecanvasctx.filter = 'none';
	func()
	badgecanvasctx.drawImage(src, 0, 0, badgecanvas.width, badgecanvas.height)
}

function setOrientation(src, orient) {
	if (orient == 1) {
		badgecanvas.width = badgeheight;
		badgecanvas.height = badgewidth;
		badgecanvasctx.save()
		badgecanvasctx.translate(badgecanvas.width/2, badgecanvas.height/2)
		badgecanvasctx.rotate(90*Math.PI/180)
		badgecanvasctx.drawImage(src, -badgewidth/2, -badgeheight/2, badgewidth, badgeheight)
		badgecanvasctx.restore()
	} else {
		badgecanvas.width = badgewidth;
		badgecanvas.height = badgeheight;
		badgecanvasctx.drawImage(src, 0, 0, badgecanvas.width, badgecanvas.height)
	}
}

function calcARatio(srcWidth, srcHeight, maxWidth, maxHeight) {
	var ratio = Math.min(maxWidth/srcWidth, maxHeight/srcHeight);
	return {width: srcWidth*ratio, height: srcHeight*ratio};
}

function processBadge(src, id) {
	curbadge = [src, id];
	splitname = [];
	badgewidth = src.width * 5;
	badgeheight = src.height * 5;
	badgeslist[id].prop(src)

	inputarea.style.filter = "unset";
	inputarea.style.pointerEvents = "unset";
}

var download = function() {
	var link = document.createElement("a");
	link.download = `Badge-${namefield.value.replace(/\s/g, "_")}.png`;
	link.href = badgecanvas.toDataURL();
	link.click()
}

/*
// Experimental Twitter OAuth
function dataURItoBlob(dataURI) {
	var arr = dataURI.split(','), mime = arr[0].match(/:(.*?);/)[1];
	return new Blob([atob(arr[1])], {type:mime});
}
OAuth.initialize("I5csvxxzDZtLuxVE_f9nMLHLvxc");
function tweetBadge() {
	var image = dataURItoBlob(badgeCanvas.toDataURL());
	OAuth.popup("twitter").then(function(result) {
		var data = new FormData();
		data.append('status', "I'm following the #Perseverance rover's journey to Mars, this is my custom badge made with #MarsBadgeMaker (https://salatielsauer.github.io/Mars-Badge-Maker)! #CountdownToMars")
		data.append('media[]', image, `Mars-Badge-Maker_${namefield.value.replace(/\s/g, "_")}.png`)
		result.post('/1.1/statuses/upload.json', {
			data: data,
			cache: false,
			processData: false,
			contentType: false
		}).fail(e=>{console.log("error:", e)});
	}).fail(e=>{console.log("error:", e)});
}
*/
