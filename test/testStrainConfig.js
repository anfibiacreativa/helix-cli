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

/* eslint-env mocha */

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const strainconfig = require('../src/strain-config-utils');

describe('Strain Config', () => {
  const config = fs.readFileSync(path.resolve(__dirname, 'fixtures/config.yaml'));

  const invalid = fs.readFileSync(path.resolve(__dirname, 'fixtures/invalid.yaml'));

  const unsorted = fs.readFileSync(path.resolve(__dirname, 'fixtures/unsorted.yaml'));

  const result = fs.readFileSync(path.resolve(__dirname, 'fixtures/result.yaml'));

  it('config can be parsed', () => {
    assert.equal(3, strainconfig.load(config).length);
  });

  it('invalid config does not throw errors', () => {
    assert.equal(1, strainconfig.load(invalid).length);
  });

  it('Can be saved as YAML', () => {
    assert.equal(strainconfig.write(strainconfig.load(result)), result);
  });

  it('Strains get sorted in the right way', () => {
    const sorted = strainconfig.load(strainconfig.write(strainconfig.load(unsorted)));
    assert.equal('default', sorted[0].name);
  });

  it('New strains can be appended', () => {
    const mystrains = strainconfig.load(config);
    const newstrains = strainconfig.append(
      strainconfig.append(mystrains, {
        name: 'xdm-address',
        content: { owner: 'adobe', repo: 'xdm', ref: 'address' },
      }),
      { content: { owner: 'adobe', repo: 'xdm', ref: 'appendanother' } },
    );
    assert.equal(newstrains.length, 5);
  });

  it('New strains override existing strains with same name', () => {
    const mystrains = strainconfig.load(config);
    const newstrains = strainconfig.append(mystrains, {
      name: 'xdm',
      content: { owner: 'adobe', repo: 'xdm', ref: 'address' },
    });
    assert.equal(newstrains.length, 3);
  });
});

describe('Generated names are stable', () => {
  it('name() generates stable IDs', () => {
    assert.deepEqual(
      strainconfig.name({
        content: { owner: 'foo', repo: 'bar' },
      }),
      strainconfig.name({
        content: { repo: 'bar', owner: 'foo' },
      }),
    );
  });
});

describe('Invalid values are rejected or fixed on the fly', () => {
  const buggy = fs.readFileSync(path.resolve(__dirname, 'fixtures/buggy.yaml'));

  it('action names without a default path get a default path', () => {
    const mystrains = strainconfig.load(buggy);
    assert.equal('/trieloff/default/git-github-com-adobe-helix-cli-git--dirty', mystrains[0].code);
  });

  it('invalid code paths get ignored', () => {
    const mystrains = strainconfig.load(buggy);
    assert.equal(1, mystrains.length);
  });
});

describe('Appending works without errors', () => {
  it('Appending to an empty file works', () => {
    const oldstrains = strainconfig.load('');
    const strain = {
      code: '/foobar/default/local--foobar--dirty',
      content: {
        repo: 'foo',
        ref: 'master',
        owner: 'null',
      },
    };
    const newstrains = strainconfig.append(oldstrains, strain);
    assert.equal(1, newstrains.length);
  });

  it('Appending to an existing file works', () => {
    const config = fs.readFileSync(path.resolve(__dirname, 'fixtures/config.yaml'));

    const oldstrains = strainconfig.load(config);
    const strain = {
      code: '/foobar/default/local--foobar--dirty',
      content: {
        repo: 'foo',
        ref: 'master',
        owner: 'null',
      },
    };
    const newstrains = strainconfig.append(oldstrains, strain);
    assert.equal(4, newstrains.length);
  });
});
