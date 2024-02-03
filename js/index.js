var header = document.querySelector("header");
var html = document.querySelector(".html");
var css = document.querySelector(".css");
var js = document.querySelector(".js");
var output = document.querySelector(".output");
var htmlCont = document.querySelector(".html code");
var cssCont = document.querySelector(".css code");
var jsCont = document.querySelector(".js code");

document.getElementById("main").style.height = `${window.innerHeight}px`;
htmlCont.textContent =
	'<!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8" /><meta name="viewport"content="width=device-width, initial-scale=1.0" /><meta http-equiv="X-UA-Compatible" content="ie=edge"/><title>Document</title></head><body></body></html>';

var jsScript = document.getElementById("js-script");

header.addEventListener("click", e => {
	if (e.target.classList.contains("htmlBtn")) {
		html.style.display = "block";
		css.style.display = "none";
		js.style.display = "none";
		output.style.display = "none";
	} else if (e.target.classList.contains("cssBtn")) {
		html.style.display = "none";
		css.style.display = "block";
		js.style.display = "none";
		output.style.display = "none";
	} else if (e.target.classList.contains("jsBtn")) {
		html.style.display = "none";
		css.style.display = "none";
		js.style.display = "block";
		output.style.display = "none";
	} else if (e.target.classList.contains("outputBtn")) {
		html.style.display = "none";
		css.style.display = "none";
		js.style.display = "none";
		output.style.display = "block";
		runCode();
	}
});

function runCode() {
	localStorage.setItem("html_code", htmlCont.textContent);
	localStorage.setItem("css_code", cssCont.textContent);
	localStorage.setItem("js_code", jsCont.textContent);

	output.innerHTML =
		`<style>${localStorage.css_code}</style>` + localStorage.html_code;

	jsScript.textContent = `${localStorage.js_code}`;
}

htmlCont.textContent = localStorage.html_code;
cssCont.textContent = localStorage.css_code;
jsCont.textContent = localStorage.js_code;
