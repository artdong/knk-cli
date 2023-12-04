'use strict';
/**
 * 初始化项目
 */
const path = require('path');
const fs = require('fs-extra');
const userHome = require('user-home');
const download = require('download-git-repo');
const log = require('./log');
const chalk = require('chalk');
const ora = require('ora');
const utils = require('./utils');

module.exports = function (program) {
    const {template, config, isInit} = program;
    const dirPath = config.name || template;
    const templateDownLoadPath = path.resolve(userHome, '.knk-cli-template', template);
    const remotePath = `direct:https://git.zhubajie.la/knk-cli-template/${template}/repository/archive.zip?ref=master`;
    const spinner = ora('downloading template...');
    spinner.start();
    download(remotePath, templateDownLoadPath, {clone: false}, (err) => {
        if (err) {
            spinner.fail(chalk.red('download template unsuccessfully'));
            log.error(err);
        } else {
            spinner.succeed(chalk.green('download template successfully'));
            let _path = process.cwd();
            const curPathName = utils.getCurDirName();
            if(!isInit && curPathName !== dirPath) {
                _path = path.resolve(process.cwd(), dirPath);
            }
            fs.copySync(templateDownLoadPath, _path);
            utils.packageGenerater(_path, config);
            utils.packageGenerater(_path, config, 'ua.json');
            utils.packageGenerater(_path, config, 'project.tt.json');
            utils.packageGenerater(_path, config, 'project.qq.json');
            utils.packageGenerater(_path, config, 'project.swan.json');
            utils.packageGenerater(_path, config, 'project.config.json');
            log.success('模板解析成功， 初始化成功');
        }
    });
};