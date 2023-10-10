/* eslint-disable @typescript-eslint/no-explicit-any */
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OdspConnectionConfig } from './interfaces';
import { OdspClient } from './OdspClient';
import { OdspDriver } from './OdspDriver';
import { tokenMap } from './interfaces';

const initOdspClient = async (config: {graphToken: string; sharePointToken: string; pushToken: string; userName: string; siteUrl: string; directory: string}) => {
    
    const odspDriver: OdspDriver = await OdspDriver.createFromEnv({
        username: config.userName,
        directory: config.directory,
        supportsBrowserAuth: true,
        odspEndpointName: 'odsp',
    });
    
    const connectionConfig: OdspConnectionConfig = {
        getSharePointToken: odspDriver.getStorageToken as any,
        getPushServiceToken: odspDriver.getPushToken as any,
        getGraphToken: odspDriver.getGraphToken as any,
        getMicrosoftGraphToken: config.graphToken,
    };
    
    tokenMap.set('graphToken', config.graphToken);
    tokenMap.set('sharePointToken', config.sharePointToken);
    tokenMap.set('pushToken', config.pushToken);
    tokenMap.set('userName', config.userName);
    tokenMap.set('siteUrl', config.siteUrl);

    return new OdspClient(odspDriver, connectionConfig);    
};

export const getOdspClient = async (config: {graphToken: string; sharePointToken: string; pushToken: string; userName: string; siteUrl: string; directory: string}) => {
    const odspClient = await initOdspClient(config);    
    return odspClient;
};
