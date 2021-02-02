(function () {
  // ================================ SOCKET =============================
  window.socket = io();
  socket.on('msg', msg => console.log(msg));
  socket.on('_error', msg => {
    console.error(msg);
    bootbox.alert({
      title: 'Error',
      message: msg,
    });
  });

  socket.on('game-count', n => {
    document.getElementById('game-count').innerText = n;
  });

  socket.on('game-list', list => {
    console.log(list);
  });
  socket.on('game-info', info => try_connect_game(info));
  socket.on('conn-game', data => connect_game(data));

  // ================================ DOM VARS =============================
  const btn_connect = document.getElementById('btn-connect');

  // ================================ EVENT CALLBACKS ============================
  // Called in response to 'req-game-info'
  function try_connect_game(gdata) {
    if (gdata.full !== 0) {
      bootbox.alert({ title: 'Cannot connect to game', message: `Game ${gdata.game} is full` });
    } else {
      bootbox.prompt({
        title: 'Connect to game...',
        message: 'Enter game password.',
        inputType: 'password',
        callback: (passwd) => socket.emit('req-conn-game', { game: gdata.game, passwd, }),
      });
    }
  }

  // Called in response to 'req-conn-game' if password is correct
  function connect_game(token) {
    window.location.href = '/play.html?t=' + token;
  }



  // ================================ MAIN =============================
  window.addEventListener('load', () => {
    window.socket.emit('from-index.html');

    socket.emit('req-game-count');

    btn_connect.addEventListener('click', () => {
      bootbox.prompt("Enter name of game you wish to connect to.", game => socket.emit('req-game-info', game));
    });

    // Any error variables?
    let params = new URLSearchParams(location.search);
    if (params.get('e')) {
      let e = params.get('e');
      switch (e) {
        case 'invalid_t':
          socket.emit('rebound-event', ['_error', `Invalid game token`]);
          break;
        case 'left':
          socket.emit('rebound-event', ['alert', `Left game`]);
          break;
        default:
          socket.emit('rebound-event', ['_error', `Unknown error occured (${e})`]);
      }
    }
  });
})();
