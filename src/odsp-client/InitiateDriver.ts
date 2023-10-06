/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { OdspConnectionConfig } from './interfaces';
import { OdspClient } from './OdspClient';
import { OdspDriver } from './OdspDriver';

const initDriver = async (driverConfig: {graphToken: string; sharePointToken: string; pushToken: string; userName: string; siteUrl: string; directory: string}) => {
    console.log('Driver init------');
    
    console.log(
        'tokens-------------------' + driverConfig.graphToken,
        driverConfig.sharePointToken,
        driverConfig.pushToken,
        driverConfig.userName,
        driverConfig.siteUrl
    );

    const driver: OdspDriver = await OdspDriver.createFromEnv({
        username: driverConfig.userName,
        directory: driverConfig.directory,
        supportsBrowserAuth: true,
        odspEndpointName: 'odsp',
    });
    console.log('Driver------', driver);
    const connectionConfig: OdspConnectionConfig = {
        getSharePointToken: driver.getStorageToken as any,
        getPushServiceToken: driver.getPushToken as any,
        getGraphToken: driver.getGraphToken as any,
        getMicrosoftGraphToken: driverConfig.graphToken,
    };

    OdspClient.init(connectionConfig, driver.siteUrl);
    return driver;
};

export const getodspDriver = async (driverConfig: {graphToken: string; sharePointToken: string; pushToken: string; userName: string; siteUrl: string; directory: string}) => {
    const odspDriver = await initDriver(driverConfig);
    console.log('INITIAL DRIVER', odspDriver);
    return odspDriver;
};
