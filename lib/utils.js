'use strict';
/**
 * 工具方法
 */
const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

/**
 * 获取git配置信息
 */
exports.getGitInfo = (key) => {
    try {
        return execSync(`git config --get ${key || ''}`).toString().trim();
    } catch (e) {
        return '';
    }
};

/**
 * 判断是否对象
 */
const isPaitObject = (data) => {
    if (data) {
        return data.toString() === '[object Object]';
    } else {
        return false;
    }
};

/**
 * 生成package.json
 * @param {*} _path
 * @param {*} conf
 */
exports.packageGenerater = (_path, conf, fileName) => {
    try {
        conf.projectname = conf.name;
        _path = path.resolve(_path, fileName || 'package.json');
        fs.stat(_path, function(err) {// 当文件存在时才进行替换
            if(err) {
                if(err.code === 'ENOENT') {
                    // console.log('当前文件不存在，请检查');
                }
                return;
            }
            let packageJson = JSON.parse(fs.readFileSync(_path) || '{}');
            let items = ['version', 'name', 'projectname', 'author', 'description', 'private'];
            let deleteItems = ['repository', 'private'];
            items.forEach(item => {
                if (deleteItems.indexOf(item) >= 0) {
                    return delete packageJson[item];
                }
                let _item = packageJson[item];
                if (isPaitObject(_item)) {
                    packageJson[item] = Object.assign(_item, conf[item] || {});
                } else if (Array.isArray(_item)) {
                    packageJson[item] = [..._item, ...(conf[item] || [])];
                } else {
                    packageJson[item] = conf[item] || packageJson[item] || '';
                }
            });
            fs.writeFileSync(_path, JSON.stringify(packageJson, null, 4));
        });
    } catch (e) {
        console.log(e.message);
    }
};

/**
 * 解析html中获取项目模版数据
 * @param {*} htmlStr
 */
exports.getTemplatesFromHtml = (htmlStr) => {
    const $ = cheerio.load(htmlStr);
    let templates = [];
    $('.projects-list').find('li').each(function() {
        let projectName = $(this).find('.project-name').text().replace(/\r|\n|\\/ig, '');
        let description = $(this).find('.description p').text();
        templates.push({
            value: projectName,
            name: projectName,
            description: description
        });
    });
    return templates;
};

/**
 * 复制文件夹到目标文件夹
 * @param {string} src 源目录
 * @param {string} dest 目标目录
 * @param {function} callback 回调
 */
exports.copyDir = (src, dest, callback) => {
    const copy = (copySrc, copyDest) => {
        fs.readdir(copySrc, (err, list) => {
            if (err) {
                callback(err);
                return;
            }
            list.forEach((item) => {
                const ss = path.resolve(copySrc, item);
                fs.stat(ss, (err, stat) => {
                    if (err) {
                        callback(err);
                    } else {
                        const curSrc = path.resolve(copySrc, item);
                        const curDest = path.resolve(copyDest, item);
   
                        if (stat.isFile()) {
                            // 文件，直接复制
                            fs.createReadStream(curSrc).pipe(fs.createWriteStream(curDest));
                        } else if (stat.isDirectory()) {
                            // 目录，进行递归
                            fs.mkdirSync(curDest, { recursive: true });
                            copy(curSrc, curDest);
                        }
                    }
                });
            });
        });
    };
   
    fs.access(dest, (err) => {
        if (err) {
        // 若目标目录不存在，则创建
            fs.mkdirSync(dest, { recursive: true });
        }
        copy(src, dest);
    });
};

/**
 * 获取当前文件夹名称
 */
exports.getCurDirName = ()=> {
    let _path = process.cwd();
    const pathArr = _path.split(path.sep);
    const curDirName = pathArr[pathArr.length - 1];
    return curDirName;
};