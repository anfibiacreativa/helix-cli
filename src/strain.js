/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

'use strict';

const deployCommon = require('./deploy-common');

module.exports = function strain() {
  let executor;

  return {
    set executor(value) {
      executor = value;
    },
    command: 'strain',
    desc: 'Activate strains in the Fastly CDN',
    builder: (yargs) => {
      deployCommon(yargs)
        .option('fastly-namespace', {
          describe: 'CDN Namespace (e.g. Fastly Service ID)',
          type: 'string',
        })
        .option('fastly-auth', {
          describe: 'API Key for Fastly API ($HLX_FASTLY_AUTH)',
          type: 'string',
        })
        .option('dry-run', {
          describe: 'List the actions that would be created, but do not actually deploy',
          type: 'boolean',
          default: false,
        })
        .demandOption(
          'fastly-auth',
          'Authentication is required. You can pass the key via the HLX_FASTLY_AUTH environment variable, too',
        )
        .demandOption(
          'fastly-namespace',
          'Fastly Service ID is required',
        )
        .group(['wsk-auth', 'wsk-namespace', 'fastly-auth', 'fastly-namespace'], 'Deployment Options')
        .group(['wsk-host', 'dry-run'], 'Advanced Options')
        .help();
    },
    handler: async (argv) => {
      if (!executor) {
        // eslint-disable-next-line global-require
        const StrainCommand = require('./strain.cmd'); // lazy load the handler to speed up execution time
        executor = new StrainCommand();
      }

      await executor
        .withWskAuth(argv.wskAuth)
        .withWskHost(argv.wskHost)
        .withWskNamespace(argv.wskNamespace)
        .withFastlyNamespace(argv.fastlyNamespace)
        .withFastlyAuth(argv.fastlyAuth)
        .withDryRun(argv.dryRun)
        .run();
    },

  };
};
