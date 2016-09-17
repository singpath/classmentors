# Database

Hold Class Mentors' database static data and rules tests


## Tests Fixtures

Most fixture data should be defined in "test/fixtures.json", with is used to set the default firebase data for a test.

Your tests should reset the firebase before running using `test/utils.js#setFirebaseData(somePatchToBaseData)`. e.g:
```js
const utils = require('./utils.js');

describe('events', function() {

  beforeEach(function() {
    utils.setFirebaseData();
  });

});
```

To retrieve fixture data, you can use `test/utils.js#fixtures(somePath)`; e.g.:
```js
const utils = require('./utils.js');

describe('auth', function() {
  let chris;

  beforeEach(function() {
    chris = utils.fixtures('auth/users/google:chris');

    // set the database with chris not registered
    utils.setFirebaseData({
      auth: {
        publicIds: {chris: undefined},
        usedPublicIds: {chris: undefined},
        users: {'google:chris': undefined}
      }
    });
  });

  it('should let a user register', function() {
    // todo
  })

});
```

Return values cannot be corrupted by a previous test and will always reflect the data set in "tests/fixtures.json".

You can use `test/utils.js#auth` to authenticate with one the fixture registered user:

- `auth.admin` (admin);
- `auth.chris` alias for `auth.admin`;
- `auth.alice` (premium, can create event and has an "alice-event" event setup);
- `auth.bob` (participant of "alice-event" event);
- `auth.emma` (only registered - to test non-participant access to event).

Those object can used with targaryen tests:
```js
expect(utils.auth.chris).can.read.path('classMentors/events');
```

Those object cannot be corrupted by a previous test.
