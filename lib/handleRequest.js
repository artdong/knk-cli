'use strict';
/**
 * 从服务端请求项目模版数据
 */
const request = require('request');

exports.handleRequest = () => {
    const {get} = request;
    return new Promise((resolve, reject) => {
        get({
            url: 'https://git.zhubajie.la/knk-cli-template',
            headers: {
                'User-Agent': 'request'
            },
        }, (error, res, body) => {
            if (error) reject(error);
            if (body) resolve(body);
        });
    });
};