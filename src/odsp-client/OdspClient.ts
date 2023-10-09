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
    OdspContainerConfig,
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

    static init(config: OdspConnectionConfig, server: string) {
        if (OdspClient.globalInstance) {
            throw new Error('OdspClient cannot be initialized more than once');
        }
        OdspClient.globalInstance = new OdspInstance(config, server);
    }

    static async createContainer(
        containerConfig: OdspCreateContainerConfig,
        containerSchema: ContainerSchema
    ): Promise<OdspResources> {
        if (!OdspClient.globalInstance) {
            throw new Error(
                'OdspClient has not been properly initialized before attempting to create a container'
            );
        }
        return OdspClient.globalInstance.createContainer(
            containerConfig,
            containerSchema
        );
    }

    static async getContainer(
        containerConfig: OdspGetContainerConfig,
        containerSchema: ContainerSchema
    ): Promise<OdspResources> {
        console.log('get container');
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
