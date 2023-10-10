/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ContainerSchema } from '@fluidframework/fluid-static';
import {
    OdspCreateContainerConfig,
    OdspGetContainerConfig,
    OdspConnectionConfig,
    OdspResources,
} from './interfaces';
import { OdspInstance } from './OdspInstance';
import { OdspDriver } from './OdspDriver';

/**
 * OdspClient static class with singular global instance that lets the developer define all Container
 * interactions with the ODSP service
 */
export class OdspClient {
    // eslint-disable-line @typescript-eslint/no-extraneous-class
    private static globalInstance: OdspInstance | undefined;

    constructor(private odspDriver: OdspDriver, private odspConnectionConfig: OdspConnectionConfig) {
        OdspClient.init(odspConnectionConfig, odspDriver.siteUrl);        
    }

    static init(config: OdspConnectionConfig, server: string) {
        if (OdspClient.globalInstance) {
            throw new Error('OdspClient cannot be initialized more than once');
        }
        
        OdspClient.globalInstance = new OdspInstance(config, server);
    }    

    async createContainer(        
        fileName: string,
        containerSchema: ContainerSchema
    ): Promise<OdspResources> {
        if (!OdspClient.globalInstance) {
            throw new Error(
                'OdspClient has not been properly initialized before attempting to create a container'
            );
        }

        const createContainerConfig: OdspCreateContainerConfig = {
            siteUrl: this.odspDriver.siteUrl,
            driveId: this.odspDriver.driveId,
            folderName: this.odspDriver.directory,
            fileName,
        }

        return OdspClient.globalInstance.createContainer(
            createContainerConfig,
            containerSchema
        );
    }

    async getContainer(
        containerConfig: OdspGetContainerConfig,
        containerSchema: ContainerSchema
    ): Promise<OdspResources> {        
        if (!OdspClient.globalInstance) {
            throw new Error(
                'OdspClient has not been properly initialized before attempting to get a container'
            );
        }
        return OdspClient.globalInstance.getContainer(
            containerConfig,
            containerSchema
        );
    }
}
