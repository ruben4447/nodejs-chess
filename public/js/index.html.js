(function () {
  // ================================ SOCKET =============================
  window.socket = io();
  socket.on('msg', msg => console.log(msg));
  socket.on('alert', arg => {
    if (typeof arg == 'string') {
      bootbox.alert(arg);
    } else {
      bootbox.alert({ title: arg.title, message: arg.msg, });
    }
  });
  socket.on('_error', msg => {
    console.log('Error Event: ' + msg);
    bootbox.alert({ title: 'Error', message: msg, });
  });

  socket.on('game-count', n => {
    document.getElementById('game-count').innerText = n;
  });
  socket.on('my-name', name => {
    if (p_myname.innerText.length != 0) p_myname.dataset.set = true;
    p_myname.innerText = name;
  });
  socket.on('connect-game', data => {
    // [data] is token to access game (time-limited)
    console.log("Authorised... Connecting to game.");
    window.location.href = '/play.html?t=' + data;
  });
  socket.on('entire-chat', lines => {
    div_chat.innerHTML = '';
    for (let { from, text } of lines) msg_line(from, text);
  });
  socket.on('new-msg', ({ from, text }) => msg_line(from, text))
  socket.on('redirect', url => location.href = url);

  const ppl_online = document.getElementById('ppl-online');
  socket.on('ppl-online', n => ppl_online.innerText = n);

  const btn_connect = document.getElementById('btn-connect');
  const btn_create = document.getElementById('btn-create');
  const p_myname = document.getElementById('my-name');
  const div_chat = document.getElementById('chat');
  const input_chat = document.getElementById('chat-input');
  const btn_send = document.getElementById('btn-send');
  function msg_line(from, text) {
    div_chat.innerHTML += `[<b>${from}</b>]  ${text}<br>`;
    div_chat.scrollTo(0, div_chat.scrollHeight); // Scroll to bottom
  }

  let create_game_dialog = {
    title: 'Create Game',
    message: `<input type='text' id='inp-game-name' class='bootbox-input form-control' placeholder='Game Name' /><br><input type='password' class='bootbox-input bootbox-input-password form-control' placeholder='Game Password' id='inp-game-passwd' /><br><input type='checkbox' id='inp-game-multiplayer' /> <abbr title='Two devices - one device for one colour'>Multiplayer</abbr>`,
    buttons: {
      cancel: {
        label: 'Cancel',
        className: 'btn btn-secondary',
      },
      create: {
        label: 'Create',
        className: 'btn btn-success',
        callback: () => {
          let name = document.getElementById('inp-game-name').value;
          let passwd = document.getElementById('inp-game-passwd').value;
          let multiplayer = document.getElementById('inp-game-multiplayer').checked;
          socket.emit('req-create-game', {
            name,
            passwd: btoa(passwd),
            s: +(!multiplayer),
          });
        },
      },
    }
  };

  let connect_game_dialog = {
    title: 'Connect to Game',
    message: `<input type='text' id='inp-game-name' class='bootbox-input form-control' placeholder='Game Name' /><br><input type='password' class='bootbox-input bootbox-input-password form-control' placeholder='Game Password' id='inp-game-passwd' /><br><input id='game-join-spec' type='checkbox' class='form-check-input bootbox-input bootbox-input-checkbox' /> Join as Spectator?`,
    buttons: {
      cancel: {
        label: 'Cancel',
        className: 'btn btn-secondary',
      },
      connect: {
        label: 'Connect',
        className: 'btn btn-primary',
        callback: () => {
          let name = document.getElementById('inp-game-name').value;
          let passwd = document.getElementById('inp-game-passwd').value;
          let spec = +(document.getElementById('game-join-spec').checked);
          socket.emit('req-connect-game', {
            name,
            passwd: btoa(passwd),
            spec,
          });
        },
      },
    }
  };

  function clickChangeName() {
    bootbox.prompt('Enter the name you wish to be visible by', name => {
      if (typeof name === 'string') socket.emit('change-name', name);
    });
  }

  // ================================ MAIN =============================
  window.addEventListener('load', () => {
    window.socket.emit('from-index.html');

    socket.emit('req-game-count');

    btn_connect.addEventListener('click', () => bootbox.dialog(connect_game_dialog));
    btn_create.addEventListener('click', () => bootbox.dialog(create_game_dialog));
    p_myname.addEventListener('click', clickChangeName);
    btn_send.addEventListener('click', () => {
      const text = input_chat.value;
      if (text.length > 0) {
        socket.emit('send-msg', text);
        input_chat.value = '';
      }
    });

    // Any error variables?
    let params = new URLSearchParams(location.search);
    let e = params.get('e');
    if (e) {
      switch (e) {
        case 'invalid_t':
          socket.emit('rebound-event', ['_error', `Invalid game token`]);
          break;
        case 'left':
          console.log('You left the game');
          break;
        case 'host_left':
          socket.emit('rebound-event', ['alert', { title: 'Connection Closed', msg: 'Host left the game.' }]);
          break;
        case 'deleted':
          socket.emit('rebound-event', ['alert', { title: 'Connection Closed', msg: 'The game was deleted.' }]);
          break;
        case 'no_spectator':
          socket.emit('rebound-event', ['alert', { title: 'Connection Closed', msg: 'Spectators are disabled for this game.' }]);
          break;
        case 'change_mode':
          socket.emit('rebound-event', ['alert', { title: 'Connection Closed', msg: 'Host changed mode of the game.' }]);
          break;
        default:
          socket.emit('rebound-event', ['_error', `Unknown error occured (${e})`]);
      }
    }
  });
})();
