var htmleditor = ace.edit("htmleditor");
var csseditor = ace.edit("csseditor");
var jseditor = ace.edit("jseditor");
htmleditor.setTheme("ace/theme/monokai");
csseditor.setTheme("ace/theme/monokai");
jseditor.setTheme("ace/theme/monokai");
htmleditor.getSession().setMode("ace/mode/html");
csseditor.getSession().setMode("ace/mode/css");
jseditor.getSession().setMode("ace/mode/javascript");
