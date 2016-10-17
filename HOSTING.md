# Hosting

"[gh-pages]" hosting example.


## Setup your Class Mentors fork

1. Go to the github [Class Mentors project].
1. Create your own fork.
1. Go to Settings > Branches. Set the default branch to "gh-pages" and click "Update".

[Video](http://screencast-o-matic.com/u/h0kl/classmentors-setup-1)


## Generate Pages

Your Github Pages will be generated after any changes to the "gh-pages" branch.
Any arbitrary change will do to publish your inintial version.

1. Go to your Github fork of Classmentors.
1. Click "index.html" in the list of files.
1. Click the edit icon (a pen icon).
1. Change something, like the title, and commit the change.
1. Go to Settings > Options > GitHub Pages. You should see a link to your
   gh-pages something like
   "https://<user-or-organisation-name>.github.io/classmentors/". Visite it;
   you should see our landing app link to our staging firebase database.
1. Keep a note of the domain name. You will need it for you Firebase App configuration.

[Video](http://screencast-o-matic.com/u/h0kl/classmentors-setup-2)


## Create your Firebase App

1. Go to the [Firebase console].
1. Click "Create New Project".
1. Select a name for your project and create the project.
1. Go to Auth > Sign-in method. Click on "Google" on the list of providers;
   enable it and save.
1. On the same page (Auth > Sign-in method), in the "OAuth redirect domains"
   section, click "Add domain" and add the gh-pages domain:
   "<user-or-organisation-name>.github.io".

[Video](http://screencast-o-matic.com/u/h0kl/classmentors-setup-3)


## Add Firebase database security rules

1. Visit our [security rule definitions] and copy the content.
1. Go to the [Firebase console].
1. Select the Firebase project you just create.
1. Go to "Database" > "Rules". Select the current default, delete them and paste the
   the content of "rules.json". Click "Publish"

[Video](http://screencast-o-matic.com/u/h0kl/classmentors-setup-4)


## Add Firebase initial data

1. Visit our [initial data export] and save the it (in Chrome it would be
   "File > Save Page as..." or right click on the page and "save as").
1. Go to the [Firebase console].
1. Select the Firebase project you just create.
1. Go to "Database" > "Data". Click the "more options" icon (three vertical dot),
   and select "Import JSON". Click on Upload file > Browse to select the
   "data.json" you downloaded.

[Video](http://screencast-o-matic.com/u/h0kl/classmentors-setup-5)

## Configure Class Mentors firebase client.

1. Go to the [Firebase console].
1. Select the Firebase project you just created.
1. Click on "Add Firebase to your web app".

    You should see something like that:

    ```html
    <script src="https://www.gstatic.com/firebasejs/3.4.1/firebase.js"></script>
    <script>
      // Initialize Firebase
      var config = {
        apiKey: "xxxxxxxxxxx-some-random-key-xxxxxxxxxxxx",
        authDomain: "classmentors-test.firebaseapp.com",
        databaseURL: "https://classmentors-test.firebaseio.com",
        storageBucket: "classmentors-test.appspot.com",
        messagingSenderId: "698779847584"
      };
      firebase.initializeApp(config);
    </script>
    ```

    Keep note of this config object.
1. Go to your Github fork of Classmentors.
1. Click "index.html" in the list of files.
1. Click on the edit icon (a pen icon).
1. find the config object, replace the `apiKey`, `authDomain` and `databaseURL`
   with your own project configuation.


You gh-pages should now be serving your Firebase App data.

[Video](http://screencast-o-matic.com/u/h0kl/classmentors-setup-6)


## Set yourself as a - Class Mentors - admin

1. Go to your Class Mentors GitHub Pages.
1. Go to "Profile" to register.
1. Pick a public ID and register.
1. Go to the [Firebase console].
1. Go to "Auth" > "Users".
1. Find the your user; there should be only one but you want find some other
   user later when more user logged on your project, you can search by email.
1. Copy your user ID
1. Go to "Database" > "Data"
1. Expand "classMentors" and click the "+" icon next to "classMentors".
1. In the new node form, set "Name" to "admins" and instead of setting a value,
   click the "+" icon.
1. in The new node form, set "Name" to your user ID (paste it) and set "Value"
   to "true" (no quote).
1. click Add.
1. Expand the "userProfiles" node, expand the node named after your
   public ID, expand the "user" node and click the "+" icon.
1. In the new node form, set "Name" to "isAdmin" and the "Value" to "true".

[Video](http://screencast-o-matic.com/u/h0kl/classmentors-setup-7)


## Add premium user (can create event)

TODO


## Override landing page

1. Go to your Github fork of Classmentors.
1. Click "index.html" in the list of files.
1. Click on the edit icon (a pen icon).
1. Find this commented out block:

    ```js
    // module.config([
    //   '$routeProvider',
    //   function($routeProvider) {
    //     $routeProvider
    //       .when('/home', {
    //         templateUrl: './home.html',
    //         resolve: {
    //           navbar: function() {
    //             return {title: 'Welcome'};
    //           }
    //         }
    //       })
    //       .otherwise('/home');
    //   }
    // ]);
    ```

    Remove the comment prefix ("// ") to enable this block.
1. Save the changes
1. Return to the list of files.
1. Click "home.html" and edit it.
1. Save the changes


[Class Mentors project]: https://github.com/singpath/classmentors
[security rule definitions]: https://raw.githubusercontent.com/singpath/classmentors/master/database/security-rules.json
[initial data export]: https://raw.githubusercontent.com/singpath/classmentors/master/database/data/export.json
[Firebase console]: https://console.firebase.google.com/
