const formatDate = ms => {
  const D = new Date(ms);
  return `${D.getDate().toString().padStart(2, '0')}/${D.getMonth().toString().padStart(2, '0')}/${D.getFullYear()} ${D.getHours().toString().padStart(2, '0')}:${D.getMinutes().toString().padStart(2, '0')}:${D.getSeconds().toString().padStart(2, '0')}`;
};

const arrayRandom = array => array[Math.floor(Math.random() * array.length)];

const rgb = (...args) => args.length == 1 ? `rgb(${args[0]}, ${args[0]}, ${args[0]})` : `rgb(${args[0]}, ${args[1]}, ${args[2]})`;

let _fontRegex = /\d+px/;
const setFontSize = (fontStr, fontSize) => fontStr.replace(_fontRegex, fontSize + "px");

const getPosFromEvent = event => {
  let el = event.target;
  let bb = el.getBoundingClientRect();
  return [event.clientX - bb.left, event.clientY - bb.top];
};