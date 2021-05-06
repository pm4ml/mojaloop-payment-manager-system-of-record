/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Murthy Kakarlamudi - murthy@modusbox.com                         *
 **************************************************************************/

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { oas } from 'koa-oas3';
import cors from '@koa/cors';

import * as http from 'http';
import * as path from 'path';

import { Logger } from '@mojaloop/sdk-standard-components';

import handlers from './handlers';
import middlewares from './middlewares';

const mysqlx = require('@mysql/xdevapi');
import Database from './lib/database';

import { ApiContext } from './types';
import { ServiceConfig } from './config';

export default class Server {
    _conf: ServiceConfig;
    _api: any;
    _server: any;
    _logger: Logger.Logger | undefined;
    _db: Database | undefined;

    constructor(conf: ServiceConfig) {
        this._conf = conf;
        this._api = null;
        this._server = null;
    }

    async setupApi() {
        this._api = new Koa<ApiContext>();

        this._logger = new Logger.Logger({
            ctx: {
                app: 'payments-system-of-record',
            },
        });

        this._db = new Database(
            {
                getClient: conf => {
                    return mysqlx.getClient(conf);
                },
            },
            { mysqlConfig: this._conf.databaseConfig, logger: this._logger }
        );

        // make sure we can make a connection to the DB before continuing to start
        // the service
        let dbConnected = false;
        while (!dbConnected) {
            try {
                await this._db.testConnection();
                dbConnected = true;
            } catch (e) {
                this._logger
                    .push(e)
                    .error(
                        'Unable to connect to database retrying in 1 second'
                    );
                await new Promise(res => setTimeout(res, 1000));
            }
        }

        let validator;
        try {
            validator = await oas({
                file: path.join(__dirname, 'api.yaml'),
                endpoint: '/openapi.json',
                uiEndpoint: '/',
            });
        } catch (e) {
            throw new Error(
                'Error loading API spec. Please validate it with https://editor.swagger.io/'
            );
        }

        this._api.use(async (ctx: ApiContext, next: () => Promise<any>) => {
            ctx.state = {
                conf: this._conf,
                db: this._db,
                logger: this._logger,
            };
            await next();
        });

        // we need to allow cookies to be forwarded from other origins as this api may not
        // be served on the same port as the UI
        this._api.use(cors({ credentials: true }));

        this._api.use(middlewares.createErrorHandler());
        this._api.use(middlewares.createRequestIdGenerator());
        this._api.use(middlewares.createLogger(this._logger));
        this._api.use(bodyParser());
        this._api.use(validator);
        this._api.use(middlewares.createRouter(handlers));

        this._server = this._createServer();
        return this._server;
    }

    async start() {
        await new Promise(resolve =>
            this._server.listen(this._conf.inboundPort, resolve)
        );
        if (this._logger) {
            this._logger.log(
                `Serving inbound API on port ${this._conf.inboundPort}`
            );
        }
    }

    async stop() {
        if (!this._server) {
            return;
        }
        await new Promise(resolve => this._server.close(resolve));
        console.log('inbound shut down complete');
    }

    _createServer() {
        return http.createServer(this._api.callback());
    }
}
