/**
 * @flow
 */

import fs from 'fs';
import path from 'path';
import spawnAsync from '@exponent/spawn-async';
import * as Versions from '../Versions';

export async function updateSdkVersionsAsync(sdkVersion: string, reactNativeTag: string, facebookRNVersion: string) {
  let versions = await Versions.versionsAsync();
  versions.sdkVersions[sdkVersion] = {
    ...versions.sdkVersions[sdkVersion],
    'exponentReactNativeTag': reactNativeTag,
    'facebookReactNativeVersion': facebookRNVersion,
  };
  await Versions.setVersionsAsync(versions);
}

export async function updateIOSSimulatorBuild(s3Client: any, pathToApp: string, appVersion: string) {
  let tempAppPath = path.join(process.cwd(), 'temp-app.tar.gz');

  await spawnAsync('tar', ['-zcvf', tempAppPath, '-C', pathToApp, '.'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'ignore', 'inherit'], // only stderr
  });

  let file = fs.createReadStream(tempAppPath);

  console.log('Uploading...');

  await s3Client.promise.putObject({
    Bucket: 'exp-ios-simulator-apps',
    Key: `Exponent-${appVersion}.tar.gz`,
    Body: file,
    ACL: 'public-read',
  });

  await spawnAsync('rm', [tempAppPath]);

  console.log('Adding to server config...');

  let versions = await Versions.versionsAsync();
  versions['iosVersion'] = appVersion;
  await Versions.setVersionsAsync(versions);
}

export async function updateAndroidApk(s3Client: any, pathToApp: string, appVersion: string) {
  let file = fs.createReadStream(pathToApp);

  console.log('Uploading...');

  await s3Client.promise.putObject({
    Bucket: 'exp-android-apks',
    Key: `Exponent-${appVersion}.apk`,
    Body: file,
    ACL: 'public-read',
  });

  console.log('Adding to server config...');

  let versions = await Versions.versionsAsync();
  versions['androidVersion'] = appVersion;
  await Versions.setVersionsAsync(versions);
}