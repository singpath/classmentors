# Firebase Deployment.

The deployment is managed via [firebase-tools] and some extension.

```bash
npm install -g firebase-tools@3
firebase login

# setup a production alias (firebase-singpath for classmentors.com)
firebase use -add

# setup a staging alias (singpath-play for classmentors.com staging)
firebase use -add
```

I suggest to always use the staging database as the default target of your
command, and to use "-P production" option when targetting production; e.g.:
```bash
firebase use staging
node bin/classmentors.js -P production backup
node bin/classmentors.js setup
firebase deploy --only database
```


## Config

The project firebase configurations are defined in "firebase.json":

- `hosting.public`: path to the built app.
- `database.rules`: path to the rules.
- `database._maintenace.defaults`: the database paths default value. Used to setup
  or update a database default values.
- `database._maintenance.backups`: the database paths to save locally. The paths
  are relative to "database/data". (note: this is meant for static data like
  list of badges or schools; you should not backup personal data locally and
  must never commit personal data to the git repository).

Your aliases are defined in ".firebaserc".


## Database


To set up you (staging) database with the default settings, badges and schools:
```bash
firebase use staging
node bin/classmentors.js setup
```

To update the badges and school backups using the production database:
```bash
node bin/classmentors.js -P production backup
```

If the made a mistake like replacing the backed files use the wrong database,
you can discard the changes:
```bash
git checkout database/data/badges.json database/data/schools.json
```

To update the (staging) security rules:
```bash
firebase use staging
firebase deploy --only database
```

### Hosting

To deploy (staging) hosting:
```
firebase use staging
firebase deploy --only hosting
```
