const btn_disconnect = document.getElementById('btn-disconnect');

btn_disconnect.addEventListener('click', () => {
  bootbox.confirm('Are you sure you want to leave the game?', bool => {
    if (bool) {
      socket._.emit('req-leave-game');
      window.location.href = '/index.html?e=left';
    }
  });
});