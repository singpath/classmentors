var functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest((req, res) => {
  // Grab the text parameter.
  const original = req.query.text;
  // Push it into the Realtime Database then send a response
  admin.database().ref('/messages').push({original: original}).then(snapshot => {
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref);
  });
});

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      console.log('Uppercasing', event.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return event.data.ref.parent.child('uppercase').set(uppercase);
    });

exports.userJoinedEvent = functions.database.ref('/classMentors/eventParticipants/{eventId}/{userId}/user')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      
       admin.database().ref('/classMentors/events/'+event.params.eventId).once('value').then(function(eventSnapshot) {
          var eventKey  = eventSnapshot.key;
          var eventData = eventSnapshot.val();
          //Currently reading writes (adds) and deletes and erroring out on delete which do not have displayNames. 
          var data = {"eventId":event.params.eventId, 
                      "userId": event.params.userId, 
                      "eventTitle":eventData.title};
          if (original && original.hasOwnProperty('displayName')){
              data["displayName"] = original.displayName;
              console.log('User joined event', event.params.eventId, event.params.userId, original);
              return admin.database().ref('/messages/userJoinedEvent').push({"userJoinedEvent": data});
          } else {
             console.log('User left event', event.params.eventId, event.params.userId);
             return admin.database().ref('/messages/userJoinedEvent').push({"userLeftEvent": data});
          }

       });
});

//TODO: Try internally updating achievements based on securely posted updates
//
exports.serviceChangesFound = functions.database.ref('/serviceCheckResults/changesFound/{taskKey}/totalAchievementsChanged')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();

});

//TODO: May need to focus on totalAchievements and grab parents to avoid lastUpdate triggering. 
//Last update triggering would tell you how often enqueue requests are being made. 
//Chnage this to update the userAchievements root to allow queries by totalAchievements 
exports.userAchievementsChanged = functions.database.ref('/classMentors/userAchievements/{userId}/services/{serviceId}/totalAchievements')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      var userId = event.params.userId;
      var serviceId = event.params.serviceId;
      var data = {};
      //if(original && original.hasOwnProperty("id")) data["codeCombatId"] = original.id;
      //if(original && original.hasOwnProperty("lastUpdate")) data["lastUpdate"] = original.lastUpdate;
      admin.database().ref('/messages/totalAchievements/'+userId).once('value').then(function(dataSnapshot) {
        var totalAchievements = dataSnapshot.val();
        var hasChanged = false;
        if(!totalAchievements){
          totalAchievements = {};
        }
        if(original) {
          if(totalAchievements.hasOwnProperty(serviceId) && totalAchievements[serviceId] == parseInt(original)){
             console.log("Not updating since original ",original, "for",serviceId,"matches", totalAchievements[serviceId]);
             hasChanged = false;
          }
          else{
           //previous = totalAchievements[serviceId];
           totalAchievements[serviceId] =  parseInt(original);
           hasChanged = true;
          }
        } 
        else{ // deletion
          totalAchievements[serviceId] = 0;
          hasChanged = true;
        }  
        //Add the timestamp
        if(hasChanged){
          var codeCombat = 0;
          var freeCodeCamp = 0;
          if(totalAchievements.hasOwnProperty("codeCombat") ){
            codeCombat =  totalAchievements['codeCombat'];
          }
          if(totalAchievements.hasOwnProperty("freeCodeCamp") ){
            freeCodeCamp = totalAchievements['freeCodeCamp'];
          }
          totalAchievements['totalAchievements'] = codeCombat+freeCodeCamp; 
          totalAchievements['lastUpdated'] = {".sv": "timestamp"};
          console.log("Updating totalAchievements for", userId, totalAchievements);
          admin.database().ref('/messages/totalAchievements/'+userId).update(totalAchievements).then(snapshot => {
            return null; // update complete. 
          });
        } else{
          return null; // no updates made. 
        }
      });
});

// Top of table. 
var template1 = `<table border="1" id="myTable">
  <tr>
    <th>School <button onclick="sortTable(0,false)">sort</button> </th>
    <th>2015 Ace <button onclick="sortTable(1,true)">sort</button></th>
    <th>2016 Ace <button onclick="sortTable(2,true)">sort</button></th>
    <th>2017 NCC <button onclick="sortTable(3,true)">sort</button></th>
    <th>Average<button onclick="sortTable(4,true)">sort</button></th>
    <th>Off Pace<button onclick="sortTable(5,true)">sort</button></th>
    <th>2017 Ace of Coders <button onclick="sortTable(6,true)">sort</button></th>
  </tr>
  `; // end start template

// Bottom of table and javascript to sort. 
var template2 = `
</table>

<script>
function sortTable(col,numericSort) {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("myTable");
  switching = true;
  /*Make a loop that will continue until
  no switching has been done:*/
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.getElementsByTagName("TR");
    /*Loop through all table rows (except the
    first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare,
      one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[col];
      y = rows[i + 1].getElementsByTagName("TD")[col];
      //check if the two rows should switch place:
      if(numericSort){
         if (parseInt(x.innerHTML) < parseInt(y.innerHTML)) {
        	//if so, mark as a switch and break the loop:
        	shouldSwitch= true;
        	break;
      	}
      } else {
      
      	if (x.innerHTML > y.innerHTML) {
        	//if so, mark as a switch and break the loop:
        	shouldSwitch= true;
        	break;
      	}
      }
      
    }
    if (shouldSwitch) {
      /*If a switch has been marked, make the switch
      and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}
sortTable(6,true);
</script>
`;

function get_table_row() {
    console.log("Called get_table_row ");
    return "<tr></tr>";
}

exports.nicParticipation = functions.https.onRequest((request, response) => {
  var html = "NIC Participation<br>";
  console.log('Returning NIC Participation details ');
  html += "\n<br><hr>";

  var content = "";
  var nicTotal = 0;
  admin.database().ref('/classMentors/stats/nic-participation').once('value').then(function(dataSnapshot) {
    nicData = dataSnapshot.val();
    var remainingCalls = 0;
    var eventsData = {};
    for (var property in nicData) {
      //Check for NCC2010 key and lookup if present. 
      var hasNCC2017Event = false;
      if (nicData.hasOwnProperty(property)) {
        //html += " " + property +" " +nicData[property]["Ace2015-and-16"] +"<br>";
        if(nicData[property].hasOwnProperty("Ace2017 Event Key")){

            remainingCalls++; // increment before each async call. 
            var eventKey = nicData[property]["Ace2017 Event Key"];
            eventsData[eventKey] = {"school":property};
            admin.database().ref('/classMentors/eventParticipants/'+eventKey).once('value').then(function(participantsSnapshot) {
              //var school = property; //local copy
              //console.log(eventsData);
              remainingCalls--;// decrement in each async callback. 
              var participantsData = participantsSnapshot.val();              
              var eventKey = participantsSnapshot.key; //local copy. 
              var school = eventsData[eventKey]['school'];
              //console.log("Checking details for eventKey " + eventKey + " school "+ school);
             
              var numRegistered = 0;
              if(participantsData){
                numRegistered = Object.keys(participantsData).length;
              }
             
              // Update NCC2017 data
              if(nicData[school].hasOwnProperty("Ace2017") && (numRegistered > nicData[school]["Ace2017"])){
                      console.log(eventKey+" event for " + school + " has "+ numRegistered +" participants which is greater than current "+nicData[school]["NCC2017"]);
                      remainingCalls++;
                      admin.database().ref('/classMentors/stats/nic-participation/'+school+"/Ace2017").set(numRegistered).then(snapshot => {
                          console.log("Updated school "+school+" from "+nicData[school]["Ace2017"]+" to "+ numRegistered+ " participants");
                          remainingCalls--;
                          //Final checks must also go here. 
                          if(!remainingCalls){
                              html += template1+content+template2;
                              response.send(html);
                          }

                      });
                //TODO: Combine these two since they are almost identical.       
              } else if(!nicData[school].hasOwnProperty("Ace2017")){ // initial data
                      console.log(eventKey+" event for school "+ school +" does not have Ace2017 key");
                      remainingCalls++;
                      admin.database().ref('/classMentors/stats/nic-participation/'+school+"/Ace2017").set(numRegistered).then(snapshot => {
                          console.log("Updated school "+school+" from nothing to "+ numRegistered+ " participants");
                          remainingCalls--;
                          //final checks must also go here. 
                          if(!remainingCalls){
                              html += template1+content+template2;
                              response.send(html);
                          }
                      });
              } else{
                      //console.log(eventKey+" event for school "+school+" does not need updates. numRegistered is "+nicData[school]["NCC2017"]);
              }
              
              // Let the last completing callback send back the HTML. 
              if(!remainingCalls){
                  html += "<div>Total Ace2017 participants: "+nicTotal+"</div>"+template1+content+template2;
                  response.send(html);
              }

            });
        } 
        // Add rows with the stale data. 
        content += "<tr>";
        content += "<td>" + property + "</td>";
        content += "<td>" + nicData[property]["Ace 2015"] + "</td>";
        content += "<td>" + nicData[property]["Ace 2016 "]  + "</td>";
        
        var event_1 = 0;
        var event_2 = 0;
        var event_3 = 0;
        var event_4 = 0;

        // These event keys are a mess and need to be fixed. 
        if(nicData[property].hasOwnProperty("Ace 2015")) event_1 = nicData[property]["Ace 2015"];
        if(nicData[property].hasOwnProperty("Ace 2016 ")) event_2 = nicData[property]["Ace 2016 "];
        if(nicData[property].hasOwnProperty("NCC2017")) event_3 = nicData[property]["NCC2017"];
        if(nicData[property].hasOwnProperty("Ace2017")) event_4 = nicData[property]["Ace2017"];
        
        // Since it may not exist at times. 
        content += "<td>" + event_3  + "</td>";

        var eventsTotal = event_1 + event_2 + event_3; 
        var eventsAverage = eventsTotal/3;
        eventsAverage = eventsAverage.toFixed(2);

        console.log(eventsAverage);
      
        content += "<td>" + eventsAverage  + "</td>";
      
        //Ace 2017
        if(nicData[property].hasOwnProperty("Ace2017")){
          var gap = eventsAverage - event_4;
          var offPaceLine = "<td>" + gap + "</td>";
          content += offPaceLine; 
          content += "<td>" + nicData[property]["Ace2017"]  + "</td>";
          nicTotal+=parseInt(nicData[property]["Ace2017"]);
        }else{
          content += "<td>" + eventsAverage + "</td>";
          content += "<td>" + -1 + "</td>";          
        }
        content +="</tr>"; 
      }
    }

  });
 });

exports.updateSchool = functions.https.onRequest((request, response) => {
  const userKey = request.query.userKey;
  const schoolKey = request.query.schoolKey;
  const token = request.query.token;
  var html = "Updaing school for user "+userKey+" and school "+schoolKey +" with token "+token;
  
  admin.database().ref('/messages/securityTokens/'+token).once('value').then(function(dataSnapshot) {
    goodToken = dataSnapshot.val();
    //console.log(goodToken, "value of token");
    html+="\n<br>";
    html+="token check was "+goodToken;
    html+="\n<br>";
    if(goodToken){
        //Get the school details from school url. 
        admin.database().ref('/classMentors/schools/'+schoolKey).once('value').then(function(dataSnapshot) {
          schoolDetails = dataSnapshot.val();
          html+="school details were "+JSON.stringify(schoolDetails);
          html+="\n<br>";
          //set the school details to userProfiles/userKey/user/school
          admin.database().ref('/classMentors/userProfiles/'+userKey+'/user/school').set(schoolDetails).then(snapshot => {
            console.log("Updated school details to",schoolDetails);
            response.send(html);
          });
          
        });
    }
    else{
       response.send(html);
    }
  });
 });

 exports.changeEvent = functions.https.onRequest((request, response) => {
  const userKey = request.query.userKey;
  const currentEvent = request.query.currentEvent;
  const newEvent = request.query.newEvent;
  const token = request.query.token;
  var html = "Moving user "+userKey+" from currentEvent "+currentEvent +" to newEvent "+newEvent+" with API token "+token;
  
  admin.database().ref('/messages/securityTokens/'+token).once('value').then(function(dataSnapshot) {
    goodToken = dataSnapshot.val();
    //console.log(goodToken, "value of token");
    html+="\n<br>";
    html+="token check was "+goodToken;
    html+="\n<br>";
    if(goodToken){
        // Add newEvent details to student registered events. 
        // Delete currentEvent from student registered events. 
       
        admin.database().ref('/classMentors/userProfiles/'+userKey).once('value').then(function(dataSnapshot) {
          userData = dataSnapshot.val();
          html+="Found user\n<br>";
          //console.log("Found user",user);
          var theData = {joinedAt :  {".sv": "timestamp"},
                        user:{"displayName":userData.user.displayName, gravatar:userData.user.gravatar}};
          
          //Add user data to eventParticipants rather than fetching. 
          return admin.database().ref('/classMentors/eventParticipants/'+newEvent+'/'+userKey).set(theData);
          
        }).then(function(dataSnapshot) {
           //newEventData = dataSnapshot.val();
           html+="Added user to new event.t\n<br>";
          //add new event to userProfiles/userKey/joinedEvents
          //Get the event data to post to joined events. 
          return admin.database().ref('/classMentors/events/'+newEvent).once('value')
        }).then(function(dataSnapshot){
          eventData = dataSnapshot.val();
          html+="Fetched newEvent data.\n<br>";
          //Post the event data
           return admin.database().ref('/classMentors/userProfiles/'+userKey+'/joinedEvents/'+newEvent).set(eventData); 
        }).then(function(dataSnapshot) {
           //joinedEvents = dataSnapshot.val();
           html+="Added joined event.\n<br>";
           //set null user record for eventParticipants/<currentEvent>/<userKey>
           // Could parallelize these last two set to nulls. 
           return Promise.all([ admin.database().ref('/classMentors/eventParticipants/'+currentEvent+'/'+userKey).set(null),
                                admin.database().ref('/classMentors/userProfiles/'+userKey+'/joinedEvents/'+currentEvent).set(null)

           ]);
        }).then(([result1, result2]) => {
            console.log(result1,result2);
            html+="Deleted userKey from currentEvent eventParticipants.\n<br>";
            html+="Delted userProfiles joined event record.\n<br>";
            response.send(html);

        });        
    }
    else{
       response.send(html);
    }
  });
 });