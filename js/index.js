var header = document.querySelector("header");
var html = document.querySelector(".html");
var css = document.querySelector(".css");
var js = document.querySelector(".js");
var output = document.querySelector(".output");
var htmlCont = document.querySelector(".html code");
var cssCont = document.querySelector(".css code");
var jsCont = document.querySelector(".js code");

document.getElementById("main").style.height = `${window.innerHeight}px`;

header.addEventListener("click", e => {
	if (e.target.classList.contains("htmlBtn")) {
		document.querySelector(".htmlBtn").classList.add("active");
		document.querySelector(".cssBtn").classList.remove("active");
		document.querySelector(".jsBtn").classList.remove("active");
		document.querySelector(".outputBtn").classList.remove("active");
		html.style.display = "block";
		css.style.display = "none";
		js.style.display = "none";
		output.style.display = "none";
	} else if (e.target.classList.contains("cssBtn")) {
		document.querySelector(".htmlBtn").classList.remove("active");
		document.querySelector(".cssBtn").classList.add("active");
		document.querySelector(".jsBtn").classList.remove("active");
		document.querySelector(".outputBtn").classList.remove("active");
		html.style.display = "none";
		css.style.display = "block";
		js.style.display = "none";
		output.style.display = "none";
	} else if (e.target.classList.contains("jsBtn")) {
		document.querySelector(".htmlBtn").classList.remove("active");
		document.querySelector(".cssBtn").classList.remove("active");
		document.querySelector(".jsBtn").classList.add("active");
		document.querySelector(".outputBtn").classList.remove("active");
		html.style.display = "none";
		css.style.display = "none";
		js.style.display = "block";
		output.style.display = "none";
	} else if (e.target.classList.contains("outputBtn")) {
		document.querySelector(".htmlBtn").classList.remove("active");
		document.querySelector(".cssBtn").classList.remove("active");
		document.querySelector(".jsBtn").classList.remove("active");
		document.querySelector(".outputBtn").classList.add("active");
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

	outputCode =
		`<style>${localStorage.css_code}</style>` +
		localStorage.html_code +
		`<script defer>${localStorage.js_code}</script>`;

	var iframeDoc = output.contentWindow.document;

	iframeDoc.open();
	iframeDoc.write(outputCode);
	iframeDoc.close();
}

htmlCont.textContent = localStorage.html_code;
cssCont.textContent = localStorage.css_code;
jsCont.textContent = localStorage.js_code;

