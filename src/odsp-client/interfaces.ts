/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    FluidContainer,
    IMember,
    IServiceAudience,
} from '@fluidframework/fluid-static';
import { ITelemetryBaseLogger } from '@fluidframework/common-definitions';
import {
    TokenFetcher,
    OdspResourceTokenFetchOptions,
} from '@fluidframework/odsp-driver-definitions';

export interface IDriveInfo {
    siteUrl: string;
    driveId: string;
}

/**
 * OdspContainerConfig holds the common properties necessary for creating and loading containers.
 * This includes values that are set on creation but can also potentially be changed based on the
 * developer's interaction with the FluidContainer.
 */
export interface OdspContainerConfig {
    sharedConfig?: {
        sharedScope: 'organization' | 'anonymous';
    };
    logger?: ITelemetryBaseLogger;
}

/**
 * OdspCreateContainerConfig defines the file metadata that will be applied for the newly created
 * ".f" file on SP that holds the data backing the container.
 */
export interface OdspCreateContainerConfig extends OdspContainerConfig {
    siteUrl: string;
    driveId: string;
    folderName: string;
    fileName: string;
}

/**
 * OdspGetContainerConfig consists of the information necessary to fetch the file holding the
 * existing container's data.
 */
export interface OdspGetContainerConfig extends OdspContainerConfig {
    fileUrl: string;
}

/**
 * OdspConnectionConfig defines the necessary properties that will be applied to all containers
 * created by an OdspClient instance. This includes callbacks for the authentication tokens
 * required for ODSP. Graph token is optional as it is only required for creating share links.
 */
export interface OdspConnectionConfig {
    getSharePointToken: TokenFetcher<OdspResourceTokenFetchOptions>;
    getPushServiceToken: TokenFetcher<OdspResourceTokenFetchOptions>;
    getGraphToken?: TokenFetcher<OdspResourceTokenFetchOptions>;
    getMicrosoftGraphToken?: string;
}

export const tokenMap: Map<string, string> = new Map();

export const containerMap: Map<string, string> = new Map();

/**
 * OdspContainerServices is returned by the OdspClient alongside a FluidContainer. It holds the
 * functionality specifically tied to the ODSP service, and how the data stored in the
 * FluidContainer is persisted in the backend and consumed by users. Any functionality regarding
 * how the data is handled within the FluidContainer itself, i.e. which data objects or DDSes to
 * use, will not be included here but rather on the FluidContainer class itself.
 */
export interface OdspContainerServices {
    /**
     * Generates a new link to point to this container based on the ContainerServiceConfiguration
     * this container was created with. If it was shared, this will create a new share link according
     * to the scope defined on the config. Otherwise, it will return a direct file link.
     */
    generateLink: () => Promise<string>;

    /**
     * Provides an object that can be used to get the users that are present in this Fluid session and
     * listeners for when the roster has any changes from users joining/leaving the session
     */
    audience: IOdspAudience;
}

export interface OdspMember extends IMember {
    userName: string;
    email: string;
}

export interface OdspResources {
    fluidContainer: FluidContainer;
    containerServices: OdspContainerServices;
}

export type IOdspAudience = IServiceAudience<OdspMember>;
