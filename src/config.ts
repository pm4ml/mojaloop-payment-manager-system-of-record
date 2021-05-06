/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

import * as env from 'env-var';
import * as dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
    user: string;
    host: string;
    schema: string;
    password: string;
    port: number;
    pooling: {
        enabled: boolean;
        maxSize: number;
        maxIdleTime: number;
        queueTimeout: number;
    };
}

export interface ServiceConfig {
    inboundPort: number;
    databaseConfig: DatabaseConfig;
}

const Config: ServiceConfig = {
    inboundPort: env.get('LISTEN_PORT').default('3000').asPortNumber(),
    databaseConfig: {
        user: env.get('DB_USER').required().asString(),
        host: env.get('DB_HOST').required().asString(),
        schema: env.get('DB_DATABASE').required().asString(),
        password: env.get('DB_PASSWORD').required().asString(),
        port: env.get('DB_PORT').default('33060').asPortNumber(),
        pooling: {
            enabled: true,
            maxSize: env
                .get('DB_CONNECTION_LIMIT')
                .default('10')
                .asIntPositive(),
            maxIdleTime: env
                .get('DB_POOL_IDLE_TIME')
                .default('1000')
                .asIntPositive(),
            queueTimeout: env
                .get('DB_POOL_QUEUE_TIMEOUT')
                .default('0')
                .asIntPositive(),
        },
    },
};

export { Config };
