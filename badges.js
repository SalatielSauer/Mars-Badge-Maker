/* badges and their properties:
	setOrientation: determines whether the badge should be rotated 90 degrees clockwise.
	addOverlay: draws the badge after the process, creating the "portrait" effect.
	drawPhoto: draws the uploaded photo centered by default, receives additional x and y values.
	writeText: writes a text after the badge and adds a new line if the character limit is reached.
	writeCountdown: writes the countdown text centered by default, receives additional x and y values.*/
	
badgeslist = [
	{
		file: "cdtm5.png",
		prop: src => {
			setOrientation(src, 0);
			addOverlay(src, ()=>{drawPhoto(0, -185, badgewidth, badgeheight)})
			writeText(75, 120, "45px Recursive", 20, 0, "white", "left")
		}
	},
	{
		file: "cdtm6.png",
		prop: src => {
			setOrientation(src, 0)
			addOverlay(src, ()=>{drawPhoto(0, -120, 700, 700)})
			writeCountdown(0, 320, "black")
			writeText(400+namefield.value.length, 1110, "85px Recursive", 20, 30, "aqua", "center")
		}
	},
	{
		file: "cdtm7.png",
		prop: src => {
			setOrientation(src, 0)
			addOverlay(src, ()=>{drawPhoto(0, 0, 700, 700)})
			writeText(400+namefield.value.length, 203, "65px Recursive", 15, 9, "aqua", "center")
		}
	},
	{
		file: "cdtm2.png",
		prop: src => {
			setOrientation(src, 1)
			writeText(badgeheight/2-170, badgewidth/2-namefield.value.length, "43px Recursive", 25, 0, "#272727", "left")
		}
	},
	{
		file: "cdtm4.jpg",
		prop: src => {
			setOrientation(src, 0)
			drawPhoto(0, 0, 450, 450)
			writeCountdown(0, 490, "white")
			writeText(badgewidth/2, 950, "60px Lobster", 30, 0, "white", "center")
		}
	},
	{
		file: "cdtm1.jpg",
		prop: src => {
			setOrientation(src, 0)
			drawPhoto(195, -195, 390, 390)
			writeText(badgewidth/2+195, 720, "60px Lobster", 20, 30, "white", "center")
			writeCountdown(200, 350, "red")
		}
	},
	{
		file: "cdtm3.png",
		prop: src => {badgeslist[3].prop(src)}
	},
	{
		file: "osiris-rex.png",
		prop: src => {
			setOrientation(src, 0)
			drawPhoto(0, 86, 400, 400)
			writeText(badgewidth/2, 1110, "60px Lobster", 30, 0, "white", "center")
		}
	}
]