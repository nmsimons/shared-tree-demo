/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OdspConnectionConfig } from './interfaces';
import { OdspClient } from './OdspClient';
import { OdspDriver } from './OdspDriver';

const initDriver = async (driverConfig: {graphToken: string; sharePointToken: string; pushToken: string; userName: string; siteUrl: string; directory: string}) => {
    
    const odspDriver: OdspDriver = await OdspDriver.createFromEnv({
        username: driverConfig.userName,
        directory: driverConfig.directory,
        supportsBrowserAuth: true,
        odspEndpointName: 'odsp',
    });
    
    const connectionConfig: OdspConnectionConfig = {
        getSharePointToken: odspDriver.getStorageToken as any,
        getPushServiceToken: odspDriver.getPushToken as any,
        getGraphToken: odspDriver.getGraphToken as any,
        getMicrosoftGraphToken: driverConfig.graphToken,
    };

    OdspClient.init(connectionConfig, odspDriver.siteUrl);
    return odspDriver;
};

export const getOdspDriver = async (driverConfig: {graphToken: string; sharePointToken: string; pushToken: string; userName: string; siteUrl: string; directory: string}) => {
    const odspDriver = await initDriver(driverConfig);    
    return odspDriver;
};
