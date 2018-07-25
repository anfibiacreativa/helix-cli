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
const assert = require('assert');
const path = require('path');
const shell = require('shelljs');
const fse = require('fs-extra');
const http = require('http');
const Replay = require('replay');
const uuidv4 = require('uuid/v4');

// disable replay for this test
Replay.mode = 'bloody';

/**
 * init git in integration so that petridish can run
 */
function initGit(dir) {
  const pwd = shell.pwd();
  shell.cd(dir);
  shell.exec('git init');
  shell.exec('git add -A');
  shell.exec('git commit -m"initial commit."');
  shell.cd(pwd);
}

async function assertFile(p) {
  const exists = await fse.pathExists(p);
  if (!exists) {
    assert.fail(`Expected file at ${p} to exists`);
  }
}

async function assertHttp(url, status, spec) {
  return new Promise((resolve, reject) => {
    let data = '';
    http.get(url, (res) => {
      try {
        assert.equal(res.statusCode, status);
      } catch (e) {
        res.resume();
        reject(e);
      }

      res
        .on('data', (chunk) => {
          data += chunk;
        })
        .on('end', () => {
          try {
            if (spec) {
              const expected = fse.readFileSync(path.resolve(__dirname, 'specs', spec)).toString();
              assert.equal(data, expected);
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        });
    }).on('error', (e) => {
      reject(e);
    });
  });
}

async function createTestRoot() {
  const dir = path.resolve(__dirname, 'tmp', uuidv4());
  await fse.ensureDir(dir);
  return dir;
}

module.exports = {
  assertFile,
  assertHttp,
  initGit,
  createTestRoot,
};