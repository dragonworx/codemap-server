const editor = CodeMirror.fromTextArea(document.getElementById('code'), {
   lineNumbers: true,
   styleSelectedText: true,
   theme: 'monokai',
   viewportMargin: Infinity,
   smartIndent: true,
   indentWithTabs: true,
   // lineWrapping: true,
});

const CM = document.querySelector('.CodeMirror');

function getEditorSize() {
   const height = CM.clientHeight;
   let width = 0;
   const gutterSize = Math.round(Math.abs(parseFloat(document.querySelector('.CodeMirror-gutter-wrapper').style.left)) * 1.25);
   document.querySelectorAll('span[role=presentation]').forEach(node => {
      width = Math.round(Math.max(width, node.getBoundingClientRect().width));
   });
   return { width, height, gutterSize };
}

window.setEditorValue = function(src, options) {
   CM.style.fontSize = `${options.fontSize}px`;
   editor.setValue(src);
   editor.markText({line: 1, ch: 1}, {line: 1, ch: 100}, {className: 'styled-background'});
   const height = CM.clientHeight;
   let width = 0;
   const gutterSize = Math.round(Math.abs(parseFloat(document.querySelector('.CodeMirror-gutter-wrapper').style.left)) * 1.25);
   document.querySelectorAll('span[role=presentation]').forEach(node => {
      width = Math.round(Math.max(width, node.getBoundingClientRect().width));
   });
   return this.getEditorSize();
};

const size = getEditorSize();
window.render = html2canvas(CM, {
   width: size.width,
   windowWidth: size.width,
   height: size.height,
   windowHeight: size.height,
}).then(canvas => {
   canvas.style.margin = '10px';
   document.body.appendChild(canvas)
});