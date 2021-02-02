const socket = {
  _: undefined,

  main() {
    this._ = io();

    window.urlParams = new URLSearchParams(window.location.search);
    this._.emit('send-token', urlParams.get('t'));

    this._addListeners();
  },

  _addListeners() {
    this._.on('msg', msg => console.log(msg));
    this._.on('alert', txt => bootbox.alert(txt));
    this._.on('_error', message => {
      console.error(message);
      bootbox.alert({ title: 'Error', message });
    });

    // Token is not valid...
    this._.on('invalid-token', () => {
      console.error("INVALID GAME TOKEN");
      document.body.innerHTML = '';
      window.location.href = '/index.html?e=invalid_t';
    });
  }
};

window.addEventListener('load', () => {
  socket.main();
});