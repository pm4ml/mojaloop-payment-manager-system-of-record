/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2019 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       Murthy Kakarlamudi - murthy@modusbox.com                             *
 **************************************************************************/

import * as http from 'http';

import { buildUrl, throwOrJson, HTTPResponseError } from './common';
import {
    Logger,
    request,
    RequestMethod,
} from '@mojaloop/sdk-standard-components';

export interface RequestsConfig {
    logger: Logger.Logger;
    endpoint: string;
}

/**
 * A class for making requests to DFSP backend API
 */
class Requests {
    agent: http.Agent;
    logger: Logger.Logger;
    transportScheme: string;
    endpoint: string;

    constructor(config: RequestsConfig) {
        this.logger = config.logger;

        // make sure we keep alive connections to the backend
        this.agent = new http.Agent({
            keepAlive: true,
        });

        this.transportScheme = 'http';

        // Switch or peer DFSP endpoint
        this.endpoint = `${this.transportScheme}://${config.endpoint}`;
    }

    /**
     * Utility function for building outgoing request headers as required by the mojaloop api spec
     *
     * @returns {object} - headers object for use in requests to mojaloop api endpoints
     */
    _buildHeaders() {
        return {
            'Content-Type': 'application/json',
        };
    }

    get(url: string, qs: { [key: string]: any } = {}) {
        Object.entries(qs).forEach(([k, v]) => {
            if (v === undefined) {
                delete qs[k];
            }
        });
        const reqOpts = {
            method: 'GET' as RequestMethod,
            uri: buildUrl(this.endpoint, url),
            headers: this._buildHeaders(),
            qs,
        };

        this.logger.push({ reqOpts }).log('Executing HTTP GET');
        return request<Record<string, unknown>>({
            ...reqOpts,
            agent: this.agent,
        })
            .then(throwOrJson)
            .catch(e => {
                this.logger.push({ e }).log('Error attempting HTTP GET');
                throw e;
            });
    }

    delete(url: string) {
        const reqOpts = {
            method: 'DELETE' as RequestMethod,
            uri: buildUrl(this.endpoint, url),
            headers: this._buildHeaders(),
        };

        this.logger.push({ reqOpts }).log('Executing HTTP DELETE');
        return request<Record<string, unknown>>({
            ...reqOpts,
            agent: this.agent,
        })
            .then(throwOrJson)
            .catch(e => {
                this.logger.push({ e }).log('Error attempting HTTP DELETE');
                throw e;
            });
    }

    put(url: string, body: any) {
        const reqOpts = {
            method: 'PUT' as RequestMethod,
            uri: buildUrl(this.endpoint, url),
            headers: this._buildHeaders(),
            body: JSON.stringify(body),
        };

        this.logger.push({ reqOpts }).log('Executing HTTP PUT');
        return request<Record<string, unknown>>({
            ...reqOpts,
            agent: this.agent,
        })
            .then(throwOrJson)
            .catch(e => {
                this.logger.push({ e }).log('Error attempting HTTP PUT');
                throw e;
            });
    }

    post(url: string, body: any) {
        const reqOpts = {
            method: 'POST' as RequestMethod,
            uri: buildUrl(this.endpoint, url),
            headers: this._buildHeaders(),
            body: JSON.stringify(body),
        };

        this.logger.push({ reqOpts }).log('Executing HTTP POST');
        return request<Record<string, unknown>>({
            ...reqOpts,
            agent: this.agent,
        })
            .then(throwOrJson)
            .catch(e => {
                this.logger.push({ e }).log('Error attempting POST.');
                throw e;
            });
    }
}

export { Requests, HTTPResponseError };
