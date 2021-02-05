String.prototype.replaceAt = function (index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length);
};

const formatDate = ms => {
  const D = new Date(ms);
  return `${D.getDate().toString().padStart(2, '0')}/${D.getMonth().toString().padStart(2, '0')}/${D.getFullYear()} ${D.getHours().toString().padStart(2, '0')}:${D.getMinutes().toString().padStart(2, '0')}:${D.getSeconds().toString().padStart(2, '0')}`;
};