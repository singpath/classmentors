import * as chai from 'chai';
import sinonChai from 'sinon-chai';
import dirtyChai from 'dirty-chai';

// Register dirtyChai
//
// See https://github.com/prodatakey/dirty-chai
chai.use(dirtyChai);

// Register sinonChai plugin
//
// See https://github.com/domenic/sinon-chai
chai.use(sinonChai);

import 'singpath-core/services/icons/icons.specs.js';
import 'singpath-core/services/crypto.specs.js';
import 'singpath-core/services/datastore.specs.js';
import 'singpath-core/services/firebase.specs.js';
import 'singpath-core/services/routes.specs.js';

