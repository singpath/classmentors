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
exports.userAchievementsChanged = functions.database.ref('/classMentors/userAchievements/{userId}/services/codeCombat/totalAchievements')
    .onWrite(event => {
      // Grab the current value of what was written to the Realtime Database.
      const original = event.data.val();
      var data = {"userId": event.params.userId};
      //if(original && original.hasOwnProperty("id")) data["codeCombatId"] = original.id;
      //if(original && original.hasOwnProperty("lastUpdate")) data["lastUpdate"] = original.lastUpdate;
      
      if(original) {
        data["totalAchievements"] = original;
      }
      //"codeCombatId":original.id,
      //"lastUpdate": original.lastUpdate,
      //"totalAchievements": original.totalAchievements,
      //console.log(event.data.ref.parent.child('freeCodeCamp'));     
      console.log('User achievements changed', data);
      admin.database().ref('/messages/userAchievementsChanged').push({"userAchievementsChanged":data}).then(snapshot => {
          return null;
      });;
});

// Top of table. 
var template1 = `<table border="1" id="myTable">
  <tr>
    <th>School <button onclick="sortTable(0,false)">sort</button> </th>
    <th>2015-16 Ace <button onclick="sortTable(1,true)">sort</button></th>
    <th>2015 Ace <button onclick="sortTable(2,true)">sort</button></th>
    <th>2016 Ace <button onclick="sortTable(3,true)">sort</button></th>
    <th>2017 NCC <button onclick="sortTable(4,true)">sort</button></th>
    <th>Off Pace<button onclick="sortTable(5,true)">sort</button></th>
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
sortTable(5,true);
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
  
  admin.database().ref('/classMentors/stats/nic-participation').once('value').then(function(dataSnapshot) {
    nicData = dataSnapshot.val();
    var remainingCalls = 0;
    var eventsData = {};
    for (var property in nicData) {
      //Check for NCC2010 key and lookup if present. 
      var hasNCC2017Event = false;
      if (nicData.hasOwnProperty(property)) {
        //html += " " + property +" " +nicData[property]["Ace2015-and-16"] +"<br>";
        if(nicData[property].hasOwnProperty("NCC2017 Event Key")){

            remainingCalls++; // increment before each async call. 
            var eventKey = nicData[property]["NCC2017 Event Key"];
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
              if(nicData[school].hasOwnProperty("NCC2017") && (numRegistered > nicData[school]["NCC2017"])){
                      console.log(eventKey+" event for " + school + " has "+ numRegistered +" participants which is greater than current "+nicData[school]["NCC2017"]);
                      remainingCalls++;
                      admin.database().ref('/classMentors/stats/nic-participation/'+school+"/NCC2017").set(numRegistered).then(snapshot => {
                          console.log("Updated school "+school+" from "+nicData[school]["NCC2017"]+" to "+ numRegistered+ " participants");
                          remainingCalls--;
                          //Final checks must also go here. 
                          if(!remainingCalls){
                              html += template1+content+template2;
                              response.send(html);
                          }

                      });
                //TODO: Combine these two since they are almost identical.       
              } else if(!nicData[school].hasOwnProperty("NCC2017")){ // initial data
                      console.log(eventKey+" event for school "+ school +" does not have NCC2017 key");
                      remainingCalls++;
                      admin.database().ref('/classMentors/stats/nic-participation/'+school+"/NCC2017").set(numRegistered).then(snapshot => {
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
                  html += template1+content+template2;
                  response.send(html);
              }

            });
        } 
        // Add rows with the stale data. 
        content += "<tr>";
        content += "<td>" + property + "</td>";
        content += "<td>" + nicData[property]["Ace2015-and-16"] +"</td>";
        content += "<td>" + nicData[property]["Ace 2015"] + "</td>";
        content += "<td>" + nicData[property]["Ace 2016 "]  + "</td>";
        if(nicData[property].hasOwnProperty("NCC2017")){
                content += "<td>" + nicData[property]["NCC2017"]  + "</td>";
                content += "<td>" + ((nicData[property]["Ace2015-and-16"]/2) - nicData[property]["NCC2017"]) + "</td>";

        }else{
                content += "<td>" + -1 + "</td>";
                content += "<td>" + nicData[property]["Ace2015-and-16"] + "</td>";
        }
        content +="</tr>";
        
        
      }
    }


  });
 });

/*
// It is possible to create public endpoints to process unauthenticated calls.  
exports.updateCohort = functions.https.onRequest((request, response) => {
  const cohortId = request.query.cohort;
  var html = "Updating cohort event rankings\n<br>";
  html +="Second line of text\n<br>";
  console.log('Returning data for cohort ', cohortId);
  html += "\n<br><hr>";
  admin.database().ref('/classMentors/cohorts/'+cohortId).once('value').then(function(dataSnapshot) {
    cohortData = dataSnapshot.val();
    html += "There are "+cohortData['events'].length+" events in this cohort.<br>";
    var remainingCalls = cohortData.events.length;
    for(var e = 0; e < cohortData.events.length; e++) {
        var eventId = cohortData.events[e];
        admin.database().ref('/classMentors/events/'+eventId).once('value').then(function(eventSnapshot) {
          var eventKey  = eventSnapshot.key;
          var eventData = eventSnapshot.val();
 
          admin.database().ref('/classMentors/eventParticipants/'+eventKey).once('value').then(function(participantsSnapshot) {
            var participantsData = participantsSnapshot.val();
            //console.log(participantsData);
            var numParticipants = 0;
            if(participantsData){
              numParticipants = Object.keys(participantsData).length;
            }
            
            html += eventData.title +"(" + numParticipants + ") EventKey " + eventKey +  "<br>";

            for (var property in participantsData) {
              if (participantsData.hasOwnProperty(property)) {
                html += "Updating badges for " + property +  "<br>";
                // TODO: Enqueue requests to update badges 
              }
            }
            remainingCalls--;
            // Check to see if this was the last call to return.
            if(remainingCalls>0){
              //console.log(remainingCalls);
            } else {
              //console.log(remainingCalls+ " finished!<br>");
              response.send(html);
            }
          });

        });
    }
  });
 });
 */

// // Start writing Firebase Functions
// // https://firebase.google.com/preview/functions/write-firebase-functions
/*
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
 });
*/