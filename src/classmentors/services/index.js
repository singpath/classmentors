'use strict';

import * as datastore from './datastore.js';
import routes from './routes.js';

module.constant('routes', routes);

module.factory('clmService', datastore.clmServiceFactory);
module.factory('clmDataStore', datastore.clmDataStoreFactory);
