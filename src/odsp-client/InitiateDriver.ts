/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { getTokens } from '../msal/tokens';
import { OdspConnectionConfig } from './interfaces';
import { OdspClient } from './OdspClient';
import { OdspDriver } from './OdspDriver';

const initDriver = async () => {
    console.log('Driver init------');

    const { graphToken, sharePointToken, pushToken, userName, siteUrl } =
        await getTokens();
    console.log(
        'tokens-------------------' + graphToken,
        sharePointToken,
        pushToken,
        userName,
        siteUrl
    );

    const driver: OdspDriver = await OdspDriver.createFromEnv({
        username: userName,
        directory: 'Sonali-Brainstorm-1',
        supportsBrowserAuth: true,
        odspEndpointName: 'odsp',
    });
    console.log('Driver------', driver);
    const connectionConfig: OdspConnectionConfig = {
        getSharePointToken: driver.getStorageToken as any,
        getPushServiceToken: driver.getPushToken as any,
        getGraphToken: driver.getGraphToken as any,
        getMicrosoftGraphToken: graphToken,
    };

    OdspClient.init(connectionConfig, driver.siteUrl);
    return driver;
};

export const getodspDriver = async () => {
    const odspDriver = await initDriver();
    console.log('INITIAL DRIVER', odspDriver);
    return odspDriver;
};
