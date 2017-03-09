/**
 */
'use strict';

// Initializes FriendlyChat.
function FriendlyChat() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageList2 = document.getElementById('messages2');
  this.messageList3 = document.getElementById('messages3');
  this.messageList4 = document.getElementById('tbody');
  this.messageList5 = document.getElementById('tbody2');
  this.theList = [];
  this.teachers = {};
  this.nicParticipation = {};

  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.buildButton = document.getElementById('build');
  this.templatesButton = document.getElementById('templates');
  this.select= document.getElementById('select');
  this.schoolSelect= document.getElementById('schoolSelect');
  this.pre= document.getElementById('pre');

  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));
  this.buildButton.addEventListener('click', this.build.bind(this));
  this.templatesButton.addEventListener('click', this.useTemplates.bind(this));
  this.select.addEventListener('change', this.selectTemplate.bind(this));
   this.schoolSelect.addEventListener('change', this.selectSchool.bind(this));
  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  this.submitImageButton.addEventListener('click', function () {
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

  this.initFirebase();
}

/* 
  TODO: function to replace currly braces in templace with values from this.nicParticipation 
  Add another selector to select the school. 
  Call the template generator on select changes when the selected school and template both exist. 


*/ 
FriendlyChat.prototype.updatePre = function () {
    console.log(this.schoolSelect.value);
    console.log(this.select.value);
    var messageText = this.templates[this.select.value].text;
    if(this.schoolSelect.value && this.select.value){
      for(var restriction in this.templates[this.select.value].restrictions){
        console.log(restriction);
        var replacement = "*** MISSING ***";
        if(FriendlyChat.nicParticipation[this.schoolSelect.value].hasOwnProperty(restriction)){
          replacement = FriendlyChat.nicParticipation[this.schoolSelect.value][restriction];
        }
        messageText = messageText.replace("{{"+restriction+"}}",replacement);
      }
      this.pre.innerHTML = messageText;
    }
};

FriendlyChat.prototype.selectTemplate = function (val) {
  console.log("Change on template select.",val.target.value);
  this.updatePre();
};

FriendlyChat.prototype.selectSchool = function (val) {
  console.log("Change on school select.",val.target.value);
  this.updatePre();
};


// Signs-in Friendly Chat.
FriendlyChat.prototype.initFirebase = function () {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Loads chat messages history and listens for upcoming ones.
FriendlyChat.prototype.loadMessages = function () {
  // Reference to the /messages/ database path.
  this.messagesRef = this.database.ref('messages/userJoinedEvent');
  // Make sure we remove all previous listeners.
  this.messagesRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function (data) {
    var val = data.val();
    val = val.userJoinedEvent;
    //console.log(val);
    if (val) { // joined and not left
      this.displayMessage(data.key, val.displayName, val.eventTitle, val.photoUrl, val.imageUrl);
    }
  }.bind(this);
  this.messagesRef.limitToLast(20).on('child_added', setMessage);
  this.messagesRef.limitToLast(20).on('child_changed', setMessage);
};

// Loads chat messages history and listens for upcoming ones.
FriendlyChat.prototype.loadMessages2 = function () {
  // Reference to the /messages/ database path.

  //console.log("Loading messages 2");
  this.messages2Ref = this.database.ref('messages/userAchievementsChanged');
  // Make sure we remove all previous listeners.
  this.messages2Ref.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function (data) {
    var val = data.val();
    val = val.userAchievementsChanged;
    //console.log(val);
    this.displayMessage2(data.key, val.userId, val.totalAchievements, val.photoUrl, val.imageUrl);
  }.bind(this);
  this.messages2Ref.limitToLast(5).on('child_added', setMessage);
  this.messages2Ref.limitToLast(5).on('child_changed', setMessage);

};
FriendlyChat.prototype.loadMessages3 = function () {
  // Reference to the /messages/ database path.
  //TODO: Need to clear the message3 element before redrawing it. 
  var myNode = document.getElementById('messages3');
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  for (var i = 0; i < this.theList.length; i++) {
    this.displayMessage3(this.theList[i].key, this.theList[i]);
  }
};

FriendlyChat.prototype.loadMessages5 = function () {
  // Reference to the /messages/ database path.
  //TODO: Need to clear the message3 element before redrawing it. 
  var myNode = document.getElementById('tbody2');
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  for (var i = 0; i < this.theList.length; i++) {
    this.displayMessage5(this.theList[i].key, this.theList[i]);
  }


};
FriendlyChat.prototype.loadMessages4 = function () {
  // Reference to the /messages/ database path.

  //console.log("Loading messages 4");
  this.messages4Ref = this.database.ref('/classMentors/stats/nic-participation');
  // Make sure we remove all previous listeners.
  this.messages4Ref.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function (data) {
    var val = data.val();
    //val = val.userAchievementsChanged;
    //this.displayMessage4(data.key, val);
    val['key'] = data.key;
    var delta = 0;
    if (val["NCC2017"] && val["Ace2015-and-16"]) {
      delta = parseInt(val["Ace2015-and-16"]) / 2 - parseInt(val["NCC2017"]);
    } else {
      delta = parseInt(val["Ace2015-and-16"]) / 2;
    }
    val['delta'] = delta;

    //TODO: If it is an update, the list should be updated rather than appended to. 
    this.theList.push(val);

    this.theList = this.theList.sort(function (a, b) {
      return parseFloat(b['delta'] - parseFloat(a['delta']));
    });
    this.loadMessages3();
    this.loadMessages5();

    //TODO: Add a loadMessages5 to redraw the table for 4 but have it in sorted order and redrawn on every change. 

  }.bind(this);
  //this.messages4Ref.orderByChild("Ace 2015").limitToLast(10).on('child_added', setMessage);
  this.messages4Ref.limitToLast(100).on('child_added', setMessage);
  this.messages4Ref.limitToLast(100).on('child_changed', setMessage);

};


// Saves a new message on the Firebase DB.
FriendlyChat.prototype.saveMessage = function (e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.checkSignedInWithMessage()) {
    var currentUser = this.auth.currentUser;
    // Add a new message entry to the Firebase Database.
    this.messagesRef.push({
      name: currentUser.displayName,
      text: this.messageInput.value,
      photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
    }).then(function () {
      // Clear message text field and SEND button state.
      FriendlyChat.resetMaterialTextfield(this.messageInput);
      this.toggleButton();
    }.bind(this)).catch(function (error) {
      console.error('Error writing new message to Firebase Database', error);
    });
  }
};

// Sets the URL of the given img element with the URL of the image stored in Firebase Storage.
FriendlyChat.prototype.setImageUrl = function (imageUri, imgElement) {
  imgElement.src = imageUri;

  // TODO(DEVELOPER): If image is on Firebase Storage, fetch image URL and set img element's src.
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
FriendlyChat.prototype.saveImageMessage = function (event) {
  var file = event.target.files[0];

  // Clear the selection in the file picker input.
  this.imageForm.reset();

  // Check if the file is an image.
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  // Check if the user is signed-in
  if (this.checkSignedInWithMessage()) {

    // TODO(DEVELOPER): Upload image to Firebase storage and add message.

  }
};

// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function () {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
FriendlyChat.prototype.signOut = function () {
  // Sign out of Firebase.
  this.auth.signOut();
};

FriendlyChat.prototype.getStudentEmailsFromStudents = function (school) {
  console.log("Returning student emails");
  var emailsList = [];
  for (var studentKey in FriendlyChat.nicParticipation[school]['students']) {
    var student = FriendlyChat.nicParticipation[school]['students'][studentKey];
    emailsList.push(" " + student.displayName + " <" + student.email + ">");
  }
  return emailsList.join(",");
}

FriendlyChat.prototype.updateEmails = function (school, user) {
  //console.log('email',user.email,'displayName',user.displayName);
  //console.log(user);
  FriendlyChat.nicParticipation[school]['students'][user.publicId] = user;
  //"studentEmails":true
}

FriendlyChat.prototype.getUser = function (school, userId) {
  //Could call for achievements here as well. 
  var self = this;
  var userPath = '/auth/users/' + userId;
  FriendlyChat.userRef = this.database.ref(userPath);
  FriendlyChat.numCallbacks++;
  FriendlyChat.userRef.once('value').then(function (snapshot) {
    var user = snapshot.val();
    self.updateEmails(school, user);
    FriendlyChat.numCallbacks--;
    if (FriendlyChat.numCallbacks) {
      //console.log(FriendlyChat.numCallbacks);
    } else {
      console.log("no more callbacks");
      console.log(FriendlyChat.nicParticipation);
    }
  });
}

FriendlyChat.prototype.getUserAchievements = function (school, userKey) {
  var self = this;  
  var achievementsPath = "classMentors/userAchievements/" + userKey + "/services/codeCombat/totalAchievements";
  FriendlyChat.achievementsRef = this.database.ref(achievementsPath);
  FriendlyChat.numCallbacks++;
  FriendlyChat.achievementsRef.once('value').then(function (snapshot) {
    FriendlyChat.numCallbacks--;
    var codeCombatAchievements = snapshot.val();
    var record = {userKey:userKey, codeCombatAchievements:codeCombatAchievements};
    if(!FriendlyChat.nicParticipation[school].hasOwnProperty('ranking')){
      FriendlyChat.nicParticipation[school]['ranking'] = [];
    }
    FriendlyChat.nicParticipation[school]['ranking'].push(record);
    //Resort ranking as new entries are added. 
    FriendlyChat.nicParticipation[school]['ranking'] = FriendlyChat.nicParticipation[school]['ranking'].sort(function (a, b) {
        return parseFloat(b['codeCombatAchievements'] - parseFloat(a['codeCombatAchievements']));
    });
  });

}

FriendlyChat.prototype.getParticipantsEmails = function (school, participants) {
  var self = this;
  //TODO: reset students
  FriendlyChat.nicParticipation[school]['students'] = {};
  for (var participant in participants) {
    //console.log(participant);
    self.getUserAchievements(school,participant);
    var path = '/auth/publicIds/' + participant;
    FriendlyChat.pRef = this.database.ref(path);
    FriendlyChat.pRef.once('value').then(function (snapshot) {
      var userId = snapshot.val();
      //console.log(userId);
      self.getUser(school,userId);
    });
  }
}

FriendlyChat.prototype.updateParticipants = function (school, eventKey) {
  var self = this;
  var path = '/classMentors/eventParticipants/' + eventKey;
  FriendlyChat.eventParticipantsRef = this.database.ref(path);
  FriendlyChat.numCallbacks++;
  FriendlyChat.eventParticipantsRef.once('value').then(function (snapshot) {
    FriendlyChat.numCallbacks--;
    var participants = snapshot.val();
    if (participants) {
      //console.log(participants);
      FriendlyChat.nicParticipation[school]['numEventParticipants'] = Object.keys(participants).length;
      self.getParticipantsEmails(school, participants);
    }

  }, function (error) { console.error(error); });
};

FriendlyChat.numCallbacks = 0;
FriendlyChat.prototype.updateEvent = function (school, eventKey) {
  var self = this;
  var path = '/classMentors/events/' + eventKey;
  //console.log(path);
  FriendlyChat.numCallbacks++;
  FriendlyChat.eventRef = this.database.ref(path);
  FriendlyChat.eventRef.once('value').then(function (snapshot) {
    // The Promise was "fulfilled" (it succeeded).
    FriendlyChat.numCallbacks--;
    //console.log(snapshot.key);
    var event = snapshot.val();
    if (event) {
      //console.log(event);
      FriendlyChat.nicParticipation[school]['eventName'] = event.title;
      self.updateParticipants(school, eventKey);
    }
  }, function (error) { console.error(error); });
};

FriendlyChat.prototype.go = function () {
  //var self = this;
  console.log("Building clicked school details.");
  for (var school in FriendlyChat.nicParticipation) {
    FriendlyChat.nicParticipation[school]['schoolName'] = school;
    //Add teacher details. 
    if (FriendlyChat.teachers.hasOwnProperty(school)) {
      //console.log("Found teacher for school ", school);
      //Add teacher to school record. 
      FriendlyChat.nicParticipation[school]['teacherEmail'] = FriendlyChat.teachers[school]['teacherEmail'];
      FriendlyChat.nicParticipation[school]['teacherFirstName'] = FriendlyChat.teachers[school]['teacherFirstName'];
    }
    else {
      //console.log("No teacher found for school ",school);
    }
    if (FriendlyChat.nicParticipation[school].hasOwnProperty("NCC2017 Event Key")) {
      var eventKey = FriendlyChat.nicParticipation[school]["NCC2017 Event Key"];
      FriendlyChat.nicParticipation[school]['cohortName'] = "2017 National Coding Championships (Junior)";
      FriendlyChat.nicParticipation[school]['cohortLink'] = "https://www.classmentors.com/#/cohorts/-Kcg7BaTyz_APsldt_cX";
      FriendlyChat.nicParticipation[school]['eventLink'] = "https://www.classmentors.com/#/events/" + eventKey;
      this.updateEvent(school, eventKey);

    }
  }

};
FriendlyChat.prototype.useTemplates = function () {
  // Build the schoolDetails
  console.log("Generating messages from templates.");
  console.log(this.templates);
};

FriendlyChat.prototype.build = function () {
  //console.log("Fetching nicParticipation and teachers.");

  var self = this;
  //Load templates
  FriendlyChat.templatesRef = this.database.ref('/classMentors/stats/templates');
  FriendlyChat.templatesRef.once('value').then(function (snapshot) {
    self.templates = snapshot.val();
    console.log(self.templates);
    //Update template selector. 
    self.updateTemplateSelector();
    //console.log(FriendlyChat.templates);
  });


  FriendlyChat.teachersRef = this.database.ref('/classMentors/stats/teachers');
  FriendlyChat.nicRef = this.database.ref('/classMentors/stats/nic-participation');
  FriendlyChat.teachersRef.once('value').then(function (snapshot) {
    // The Promise was "fulfilled" (it succeeded).
    FriendlyChat.teachers = snapshot.val();
    //console.log(FriendlyChat.teachers);
    // TODO: Call function to process teachers data into nic-participation (theList) or download another copy here for dedicated processig. 

    FriendlyChat.nicRef.once('value').then(function (snapshot) {
      // The Promise was "fulfilled" (it succeeded).
      FriendlyChat.nicParticipation = snapshot.val();
      //console.log(FriendlyChat.nicParticipation);
      self.go();
    }, function (error) { console.error(error); });

  }, function (error) {
    // The Promise was rejected.
    console.error(error);
  });

};
// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function (user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL; // Only change these two lines!
    var userName = user.displayName;   // Only change these two lines!

    // Set the user's profile pic and name.
    //this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();
    this.loadMessages2();
    this.loadMessages4();
    //this.build();

    // We save the Firebase Messaging Device token and enable notifications.
    this.saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
FriendlyChat.prototype.checkSignedInWithMessage = function () {
  /* TODO(DEVELOPER): Check if user is signed-in Firebase. */
  if (this.auth.currentUser) {
    return true;
  }
  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Saves the messaging device token to the datastore.
FriendlyChat.prototype.saveMessagingDeviceToken = function () {
  // TODO(DEVELOPER): Save the device token in the realtime datastore
};

// Requests permissions to show notifications.
FriendlyChat.prototype.requestNotificationsPermissions = function () {
  // TODO(DEVELOPER): Request permissions to send notifications.
};

// Resets the given MaterialTextField.
FriendlyChat.resetMaterialTextfield = function (element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

FriendlyChat.MESSAGE_TEMPLATE2 =
  '<div class="message-container">' +
  //'<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';


// A loading image URL.
FriendlyChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Template for messages.
FriendlyChat.MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  //'<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage = function (key, name, text, picUrl, imageUri) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function () {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in.
  setTimeout(function () { div.classList.add('visible') }, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();
};

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage2 = function (key, name, text, picUrl, imageUri) {

  var div = document.getElementById(key);
  //console.log("key ", key,"name",name, "text", text);

  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE2;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList2.appendChild(div);
  }
  //div.querySelector('.name').textContent = name;
  div.querySelector('.name').textContent = name;
  div.querySelector('.message').textContent = text;

  setTimeout(function () { div.classList.add('visible') }, 1);
};

FriendlyChat.MESSAGE_TEMPLATE3 =
  '<div class="message-container">' +
  //'<div class="spacing"><div class="pic"></div></div>' +
  '<b><span class="Delta"></span></b>' +
  '<span> </span>' +
  '<span class="school"></span>' +
  '<span> Aces </span>' +
  '<span class="Ace2015-and-16"></span>' +
  '<span> NCC </span>' +
  '<span class="NCC2017"></span>' +
  '</div>';

FriendlyChat.prototype.displayMessage3 = function (key, val) {

  var div = document.getElementById(key);
  //console.log("key ", key,"val",val);

  // If an element for that message does not exists yet we create it.
  // TODO: This will cause duplicates on edits of existing values. 
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE3;
    div = container.firstChild;
    div.setAttribute('id', val.key);
    this.messageList3.appendChild(div);
    //console.log(this.messageList3);
  }
  div.querySelector('.school').textContent = val.key;
  div.querySelector('.Ace2015-and-16').textContent = val["Ace2015-and-16"];
  //div.querySelector('.Ace2015').textContent = val["Ace 2015"];
  //div.querySelector('.Ace2016').textContent = val["Ace 2016 "];
  div.querySelector('.NCC2017').textContent = val["NCC2017"];
  div.querySelector('.Delta').textContent = val['delta'];//val["NCC2017"];
  setTimeout(function () { div.classList.add('visible') }, 1);
};


FriendlyChat.MESSAGE_TEMPLATE4 =
  '<td class="name">name</td>' +
  '<td class="Ace2015-and-16">message</td>' +
  '<td class="Ace2015">Ace 2015</td>' +
  '<td class="Ace2016">Ace 2016</td>' +
  '<td class="NCC2017">NCC 2017</td>' +
  '<td class="Delta">Delta</td>';

FriendlyChat.MESSAGE_TEMPLATE5 =
  '<td class="name">name</td>' +
  '<td class="Ace2015-and-16">message</td>' +
  '<td class="Ace2015">Ace 2015</td>' +
  '<td class="Ace2016">Ace 2016</td>' +
  '<td class="NCC2017">NCC 2017</td>' +
  '<td class="Delta">Delta</td>';

FriendlyChat.prototype.displayMessage5 = function (key, val) {

  var container = document.getElementById(key + "-row");
  //console.log("displayMessage5 key ", key,"val",val);

  // If an element for that message does not exists yet we create it.
  // TODO: This hardcode to true will cause duplicates on edits of existing values. 
  if (!container) {
    // TODO: Need to add the new tr elements in the proper location. 
    var container = document.createElement('tr');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE5;
    container.setAttribute('id', key + "-row");
    //tr = container.firstChild;
    //tr.setAttribute('name', "testing");
    this.messageList5.appendChild(container);
  }
  container.querySelector('.name').textContent = key;
  container.querySelector('.Ace2015-and-16').textContent = val["Ace2015-and-16"];
  container.querySelector('.Ace2015').textContent = val["Ace 2015"];
  container.querySelector('.Ace2016').textContent = val["Ace 2016 "];
  container.querySelector('.NCC2017').textContent = val["NCC2017"];
  var delta = 0;
  if (val["NCC2017"] && val["Ace2015-and-16"]) {
    delta = parseInt(val["Ace2015-and-16"]) / 2 - parseInt(val["NCC2017"]);
  } else {
    delta = parseInt(val["Ace2015-and-16"]) / 2;
  }
  container.querySelector('.Delta').textContent = delta;//val["NCC2017"];
  setTimeout(function () { container.classList.add('visible') }, 1);
};

FriendlyChat.prototype.updateTemplateSelector = function () {

  //var container = document.getElementById("select");
  //console.log("select", container);
  console.log("templates", this.templates);
  for(var template in this.templates){
    console.log(template);
    var option = document.createElement("option");
    option.text = template;
    option.value = template;
    this.select.add(option);
  }
  //console.log("schools", this.nicParticipation);
  for(var school in FriendlyChat.nicParticipation){
    console.log(school);
    var option = document.createElement("option");
    option.text = school;
    option.value = school;
    this.schoolSelect.add(option);
  }

};


// Enables or disables the submit button depending on the values of the input
// fields.
FriendlyChat.prototype.toggleButton = function () {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
FriendlyChat.prototype.checkSetup = function () {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
      'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
      'actually a Firebase bug that occurs rarely. ' +
      'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
      'and make sure the storageBucket attribute is not empty. ' +
      'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
      'displayed there.');
  }
};

window.onload = function () {
  window.friendlyChat = new FriendlyChat();
};

