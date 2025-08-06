document.addEventListener('DOMContentLoaded', function() {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const messageArea = document.getElementById('messageArea');
  const finishButton = document.getElementById('finishButton');
  const mask = document.getElementById('mask');
  const modal = document.getElementById('modal');

  // クエリからチャット相手のuser_id取得
  const params = new URLSearchParams(window.location.search);
  const userId = parseInt(params.get('user_id'), 10);

  let toUserName = "（送信先不明）";
  let myName = "";

  // 1. まず自分の名前をAPIから取得
  fetch('/get_me')
    .then(res => res.json())
    .then(me => {
      myName = me.user_name;

      // 2. チャット相手の名前もAPIから取得
      fetch('/get_users')
        .then(res => res.json())
        .then(users => {
          const user = users.find(u => u.id === userId);
          if (user) {
            toUserName = user.名前;
            document.getElementById('userName').textContent = user.名前;

            // 3. 履歴を取得して表示
            fetch('/get_chat_history?to_user=' + encodeURIComponent(toUserName))
              .then(res => res.json())
              .then(history => {
                messageArea.innerHTML = ""; // 一度クリア
                history.forEach(m => {
                  if (m.from_user === myName) {
                    addUserMessage(m.message);
                  } else {
                    addBotMessage(m.message);
                  }
                });
                scrollToBottom();
              });
          }
        });
    });

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message === '') return;

    // サーバーにPOST
    fetch('/send_message', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        to_user: toUserName,
        message: message
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        addUserMessage(message);  // 表示
        messageInput.value = '';
        scrollToBottom();
      } else {
        alert('メッセージ送信失敗: ' + (data.error || ''));
      }
    });
  }

  function addUserMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'user-message');
    messageElement.textContent = text;
    messageArea.appendChild(messageElement);
    scrollToBottom();
  }
  function addBotMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot-message');
    messageElement.textContent = text;
    messageArea.appendChild(messageElement);
    scrollToBottom();
  }
  function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
  }

  finishButton.addEventListener('click', () => {
    mask.classList.remove('hidden');
    modal.classList.remove('hidden');
    setTimeout(() => { window.location.href = "/search"; }, 2000);
  });

  mask.addEventListener('click', () => {
    mask.classList.add('hidden');
    modal.classList.add('hidden');
  });
});
