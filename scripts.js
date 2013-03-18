/* Defined in: "Textual.app -> Contents -> Resources -> JavaScript -> API -> core.js" */

// TODO:
//   1. Hide avatars if not a grove server
//   2. Can we avoid basic auth for grove API?
//   3. Fix L72
//   4. Retry blank avatars on new line added

window.onload = function() {
  // Load jQuery
  var s = document.createElement('script');
  s.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js';
  document.body.appendChild(s);
};

(function(){
  var Txt = window.Textual,
      api = 'https://grove.io/api/',
      users = {},
      channelName,
      organizationID,
      channelID;

  // -----------------------
  // Textual event handlers
  // -----------------------

  Txt.viewFinishedLoading = function() {
    Txt.fadeInLoadingScreen(1.00, 0.95);

    setTimeout(function() {
      Txt.scrollToBottomOfView();
    }, 500);
  };

  Txt.viewFinishedReload = function() {
    Txt.viewFinishedLoading();
  };

  Txt.viewInitiated = function(viewType, serverHash, channelHash, channelID) {
    channelName = channelID;
    initUsers();
    bootstrap().then(insertAvatars);
  };

  Txt.newMessagePostedToView = function(lineNumber) {
    var $line = $('#line' + lineNumber),
        user = users[$line.attr('nick')];

    if (user) { return insertAvatars(); }
    getUsers().then(insertAvatars);
  };

  // -----------------------
  // Grove.io API functions
  // -----------------------

  // Get auth data and store organization ID
  function getAuth() {
    return $.get(api + 'auth').then(function(data) {
      organizationID = data.organizations[0].id;
    });
  }

  // Get organization data and get the correct channel ID from it
  function getOrganization() {
    if (!organizationID) { throw('No organizationID'); }

    return $.get(api + 'organizations/' + organizationID).then(function(data) {
      // TODO: this is brittle, just looks for first channel. It should get the
      // current channel but that dies for 1-1 chats.
      // https://grove.io/help/api#private-channel

      // channelID = data.channels.filter(function(channel) {
      //   return channelName = channel.name;
      // })[0];
      channelID = data.channels[0].id;
    });
  }

  // Get all users in this channel and store details for later
  function getUsers() {
    return $.get(api + 'channels/' + channelID + '/users').then(function(data) {
      data.forEach(registerUser);
    });
  }

  // -----------------------
  // Avatars
  // -----------------------

  function insertAvatars() {
    for (var username in users) {
      if (users.hasOwnProperty(username)) {
        $('.line[nick=' + username + ']').each(function(i, el) {
          insertAvatar(el, users[username]);
        });
      }
    }
  }

  function insertAvatar(el, user) {
    if (!user) { return; }
    var img = document.createElement('img'),
        src = user.userpics.size_28,
        $img = $(el).find('.avatar');

    // Don't try to re-replace avatars that are already correct
    if($img.attr('src') === src) { return; }

    img.className = 'avatar';
    img.onload = function() { $img.attr('src', src); };
    img.src = src;
  }

  // -----------------------
  // Application
  // -----------------------

  function bootstrap() {
    return getAuth().then(getOrganization).then(getUsers);
  }

  // Pull users from localStorage on init
  function initUsers() {
    users = JSON.parse(localStorage.getItem('txt:users')) || {};
  }

  function persistUsers() {
    localStorage.setItem('txt:users', JSON.stringify(users));
  }

  // Add a user to the global register
  function registerUser(user) {
   if (!users[user.username]) { users[user.username] = user; }
   persistUsers();
  }

})();
