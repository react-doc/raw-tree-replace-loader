/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Kenny Wong @jaywcjlove
*/
const loaderUtils = require('loader-utils');
const DirectoryTree = require('directory-tree-md');
const PATH = require('path');
const FS = require('fs');

function getAllWatchPath(arr, pathArr = []) {
  arr.forEach((item) => {
    if (item.type === 'file') {
      pathArr.push(item.path)
    }
    if (item.children && item.children.length > 0) {
      pathArr.concat(getAllWatchPath(item.children, pathArr));
    }
  })
  return pathArr;
}

function replacePath(dirs, path) {
  for (let i = 0; i < dirs.length; i += 1) {
    const element = PATH.dirname(dirs[i]);
    const reg = new RegExp(`^${element}`, 'gi');
    if (reg.test(path)) {
      path = path.replace(reg, '');
      break;
    }
  }
  return path;
}

function getRelativePath(arr, relativePath, dirs) {
  const pathArr = [];
  arr.forEach((item) => {
    if (relativePath && item.path) {
      item.path = replacePath(dirs, item.path);
    }
    if (item.children && item.children.length > 0) {
      item.children = getRelativePath(item.children, relativePath, dirs);
    }
    pathArr.push(item);
  })
  return pathArr;
}

module.exports = function (source) {
  const options = loaderUtils.getOptions(this) || {};
  const { include, directoryTrees } = options;
  const { dir, relativePath, ...otherProps } = directoryTrees
  let content = typeof source === "string" ? JSON.parse(source) : source;

  if (this.cacheable) this.cacheable();
  if (directoryTrees && (!include || include.test(this.resourcePath))) {
    const dirs = Array.isArray(dir) ? dir : [dir];
    const dirTree = dirs.map((path) => DirectoryTree(path, otherProps));
    content = dirTree;

    const filemd = getAllWatchPath(dirTree);
    filemd.forEach((fileItem) => {
      this.addDependency(fileItem);
    });
    content = getRelativePath(dirTree, relativePath, dirs.sort((a, b) => {
      if (a.length < b.length) return 1;
      if (a.length > b.length) return -1;
      return 0;
    }));
  }
  content = JSON.stringify(content).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `module.exports = ${content}`;
}
