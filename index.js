/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Kenny Wang @jaywcjlove
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

module.exports = function (source) {
  const options = loaderUtils.getOptions(this) || {};
  const { include, extensions, directoryTrees } = options;
  const { dir, ...otherProps } = directoryTrees
  let content = typeof source === "string" ? JSON.parse(source) : source;

  if (this.cacheable) this.cacheable();

  if (directoryTrees && (!include || include.test(this.resourcePath))) {
    if (Array.isArray(dir)) {
      content = dir.map((path) => DirectoryTree(path, otherProps));
    } else {
      content = DirectoryTree(dir, otherProps);
    }
    const filemd = getAllWatchPath(content);
    filemd.forEach((fileItem) => {
      this.addDependency(fileItem);
    });
  }
  
  content = JSON.stringify(content).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  return `module.exports = ${content}`;
}
