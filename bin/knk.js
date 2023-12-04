#!/usr/bin/env node
'use strict';

const inquirer = require('inquirer');
const log = require('../lib/log');
const init = require('../lib/init');
const gitRequest = require('../lib/handleRequest');
const program = require('commander');
const pkg = require('../package.json');
const ora = require('ora');
const chalk = require('chalk');
const utils = require('../lib/utils');

const spinner = ora('Downloading template...');

program
    .option('-v, --version', 'output the version');

program
    .usage('<command> [template]')
    .description('knk start [template]: 根据选择的模版初始化项目')
    .version(pkg.version)
    .parse(process.argv);

program.on('--help', function () {
    help();
});

let project_templates = [];

let defaultConfig = [
    {name: 'name', message: '请输入项目名', default: ''},
    {name: 'description', message: '项目描述', default: ''},
    {name: 'version', message: '版本号', default: '1.0.0'},
    {name: 'author', message: '作者', default: utils.getGitInfo('user.name')},
    {
        name: 'confirm',
        message: '是否确认生成项目',
        default: 'Yes'
    },
    {
        name: 'judege',
        message: '',
        default: '',
        when: function(anwser) {
            if (['y', 'Y', 'Yes', 'yes', 'YES'].indexOf(anwser.confirm) < 0) {
                process.exit();
            }
        }
    }
];

const commands = program.args;

runCommand(commands, program);

/**
 * 运行命令
 * @param  {String} command 命令脚本
 * @param  {Object} env     运行环境
 */
function runCommand(commands) {
    const firstCommand = commands[0];
    const secondCommand = commands[1];
    
    // 当没有输入指令时,默认输出help信息
    if(!firstCommand) {
        program.help();
    }

    log.info('Get template form remote ......');
    spinner.start();
    gitRequest.handleRequest()
        .then((res) => {
            const htmlStr = res;
            let templates = utils.getTemplatesFromHtml(htmlStr);
            templates = project_templates.concat(templates);

            switch(firstCommand) {
            case 'init':
            case 'start':
            {
                let isInit = false;
                if(firstCommand === 'init') {
                    isInit = true;
                    const curDirName = utils.getCurDirName();
                    defaultConfig.splice(0, 1, {name: 'name', message: '请输入项目名', default: curDirName || ''});
                }
                if(secondCommand) {
                    if(!templates.length || !templates.filter(item => item.name === secondCommand).length) {
                        spinner.fail(chalk.gray(`Get no template called ${secondCommand} form remote ......`));
                        return;
                    }
                    spinner.succeed(chalk.green('Get template form remote successfully'));
                    let template = secondCommand;
                    initProject(defaultConfig, template, isInit);
                }else {
                    if(templates.length) {
                        defaultConfig.splice(4, 0, {
                            name: 'template', 
                            message: '请选择模板类型?', 
                            type: 'list', 
                            choices: templates.map(item => {
                                let {name, value} = item;
                                return {name, value};
                            }), 
                            default: templates[0].value
                        });
                    }else {
                        spinner.fail(chalk.gray('Get no template form remote ......'));
                    }
                    spinner.succeed(chalk.green('Get template form remote successfully'));
                    initProject(defaultConfig, null, isInit);
                }
                break;
            }
            default:
                program.help();
            }
        }).catch(() => {
            spinner.warn('Get template fail');
        });
}

function initProject (config = defaultConfig, tpl, isInit) {
    // 通过菜单选项获取初始化配置信息
    inquirer.prompt(config)
        .then(data => {
            const config = data;
            const template = tpl || config.template;
            log.info(`项目选择成功，正在开始为您初始化项目(${template}).......`);
            // 初始化项目
            init({
                template,
                config,
                isInit
            });
        });
}

// 自定义 help
function help() {
    let tplNames = 'orochi-antd4-webpack5|orochi-antd3-webpack3|orochi-nuxt-iview|orochi-nuxt-vant|taro-react';
    if(project_templates.length) {
        const tmlNameArr = project_templates.map(item => item.name);
        tplNames = tmlNameArr.join('|');
    }
    console.log();
    console.log('  Global Commands:');
    console.log();
    log.tip('    knk start: ', '开启cli模板选择');
    log.tip('    knk init: ', '开启cli模板选择（适用于先在git上创建项目，克隆到本地，再选择模版初始化项目）');

    log.tip(`    knk start <template>(${tplNames}): `, '初始化项目模板');
    log.tip(`    knk init <template>(${tplNames}): `, '初始化项目模板(适用于先在git上创建项目，克隆到本地，再选择模版初始化项目)');
    return;
}




