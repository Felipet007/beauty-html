/*
 * xml-beautify - pretty-print text in XML formats.
 *
 * Copyright (c) 2018 Tom Misawa, riversun.org@gmail.com
 *
 * MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Usage:
 *
 *       const resultXmlText = new XmlBeautify().beautify(textInput.value,
 *       {
 *            indent: '  ',  //indent pattern like white spaces
 *            useSelfClosingElement: true //true:use self-closing element when empty element.
 *       });
 *
 * How "useSelfClosingElement" property works.
 *
 *   useSelfClosingElement:true
 *   <foo></foo> ==> <foo/>
 *
 *   useSelfClosingElement:false
 *   <foo></foo> ==> <foo></foo>
 *
 */
const NONE_SPECIFIED_TYPE = 0;
const ELEMENT_NODE = 1;
const ATTRIBUTE_NODE = 2;
const TEXT_NODE = 3;
const CDATA_SECTION_NODE = 4;
const PROCESSING_INSTRUCTION_NODE = 7;
const COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;
const DOCUMENT_TYPE_NODE = 10;
const DOCUMENT_FRAGMENT_NODE = 11;

const DEFAULT_INDENT = '  ';

const START_TAG_PREFIX = '<';
const START_TAG_SUFFIX = '>';
const EMPTY_TAG_SUFFIX = ' />';
const END_TAG_PREFIX = '</';
const END_TAG_SUFFIX = '>';

const CDATA_SECTION_PREFIX = '<![CDATA[';
const CDATA_SECTION_SUFFIX = ']]>';
const COMMENT_PREFIX = '<!--';
const COMMENT_SUFFIX = '-->';

export default class XmlBeautify {
  constructor(option) {
    const opt = option || {};
    this.userExternalParser = false;
    if (opt.parser) {
      this.userExternalParser = true;
      this.parser = new opt.parser();
    } else {
      this.parser = new DOMParser();
    }
  }

  beautify(xmlText, data = {}) {
    const buildInfo = {
      indentText: data.indent || DEFAULT_INDENT,
      xmlText: '',
      useSelfClosingElement: !!data.useSelfClosingElement,
      indentLevel: 0,
      textContentOnDifferentLine: !!data.textContentOnDifferentLine
    }

    const doc = this.parser.parseFromString(xmlText, 'text/xml');

    if (XmlBeautify.#hasXmlDefinition(xmlText)) {
      const encoding = XmlBeautify.#getEncoding(xmlText) || 'UTF-8';
      const xmlHeader = '<?xml version="1.0" encoding="' + encoding + '"?>';
      buildInfo.xmlText += xmlHeader + '\n';
    }

    const root = this.userExternalParser? XmlBeautify.#getChildren(doc, ELEMENT_NODE)[0] : doc.children[0];
    XmlBeautify.#parseInternally(root, buildInfo, this.userExternalParser);

    return buildInfo.xmlText;
  };

  static #hasXmlDefinition(xmlText) {
    return xmlText.indexOf('<?xml') >= 0;
  }

  static #hasContent(element){
    const regExp = /^[ \t\n\r]*$/;
    return !regExp.test(element.textContent);
  }

  static #isIndentNode(nodeType){
    return nodeType === ELEMENT_NODE
    || XmlBeautify.#isContentNode(nodeType)
  }

  static #isContentNode(nodeType){
    return nodeType === TEXT_NODE
    || nodeType === CDATA_SECTION_NODE
    || nodeType === COMMENT_NODE;

    //TODO: PROCESSING_INSTRUCTION_NODE && DOCUMENT_TYPE_NODE
  }

  static #getEncoding(xmlText) {
    try{
      const encodingStartPosition = xmlText.toLowerCase().indexOf('encoding="') + 'encoding="'.length;
      const encodingEndPosition = xmlText.indexOf('"?>');
      return xmlText.substring(encodingStartPosition, encodingEndPosition);
    } catch {
      return null;
    }

  }

  /**
   * Returns Array of child that will be indented, such as text, element or comment
   * @param element the parent element which children is going to be extracted
   * @param type specify a type if you want only one type of children
   * @returns {*[]} an array with children. If there is no children, the array will be empty
   * @private
   */
  static #getChildren(element, type = NONE_SPECIFIED_TYPE) {
      const children = [];

      if(element.childNodes) {
        for (let i = 0; i < element.childNodes.length; i++) {
          if (type === NONE_SPECIFIED_TYPE && XmlBeautify.#isIndentNode(element.childNodes[i].nodeType)) {
            children.push(element.childNodes[i]);
          } else if(type === element.childNodes[i].nodeType){
            children.push(element.childNodes[i]);
          }
        }
      }
      return children;
  }

  static #getIndent(buildInfo){
    let indentText = '';
    for (let idx = 0; idx < buildInfo.indentLevel; idx++) {
      indentText += buildInfo.indentText;
    }
    return indentText;
  }

  static #parseInternally(element, buildInfo, userExternalParser = false, needsIndent = true) {
    let elementTextContent = element.textContent;

    const blankReplacedElementContent = elementTextContent.replace(/ /g, '').replace(/\r?\n/g, '').replace(/\n/g, '').replace(/\t/g, '');

    if (blankReplacedElementContent.length === 0) {
      elementTextContent = '';
    }

    const elementHasNoChildren = userExternalParser? !(XmlBeautify.#getChildren(element).length > 0) : !(element.childNodes.length > 0);
    const elementHasValueOrChildren = (elementTextContent && elementTextContent.length > 0);
    const elementHasItsValue = elementHasNoChildren && elementHasValueOrChildren;
    const isEmptyElement = elementHasNoChildren && !elementHasValueOrChildren;
    const useSelfClosingElement = buildInfo.useSelfClosingElement;

    let valueOfElement = '';

    if(needsIndent)
      buildInfo.xmlText += XmlBeautify.#getIndent(buildInfo);

    buildInfo.xmlText += START_TAG_PREFIX + element.tagName

    if(element.attributes)
      XmlBeautify.#addAttributesOfElement(element, buildInfo);

    buildInfo.xmlText += isEmptyElement && useSelfClosingElement? EMPTY_TAG_SUFFIX : START_TAG_SUFFIX;

    if (elementHasItsValue) {
      buildInfo.xmlText += valueOfElement;
    } else if (!isEmptyElement || useSelfClosingElement) {
        buildInfo.xmlText += '\n';
    }

    buildInfo.indentLevel++;

    const childrenNodes = userExternalParser? XmlBeautify.#getChildren(element) : element.childNodes;
    let closingNeedsIndent = true;
    for (const child of childrenNodes) {
      let nextSiblingNeedsIndent = closingNeedsIndent;
      closingNeedsIndent = true;

      if(child.nodeType === ELEMENT_NODE){
        XmlBeautify.#parseInternally(child, buildInfo, userExternalParser, nextSiblingNeedsIndent);
      } else if(XmlBeautify.#isContentNode(child.nodeType) && XmlBeautify.#hasContent(child)){
          closingNeedsIndent = XmlBeautify.#addTextElementToBuild(child, buildInfo);
      }

    }
    buildInfo.indentLevel--;
    buildInfo.xmlText = buildInfo.xmlText.replace(/ *$/g, '');

    if(!isEmptyElement && !(elementHasNoChildren && elementHasValueOrChildren) && closingNeedsIndent){
        buildInfo.xmlText += XmlBeautify.#getIndent(buildInfo);
    }

    if ((isEmptyElement && !useSelfClosingElement) || !isEmptyElement) {
        const endTag = END_TAG_PREFIX + element.tagName + END_TAG_SUFFIX;
        buildInfo.xmlText += endTag;
        buildInfo.xmlText += '\n';
    }
  };

  static #addAttributesOfElement(element, buildInfo){
    for(let idx = 0; idx<element.attributes.length; idx++){
      const attribute = element.attributes[idx];
      buildInfo.xmlText += ' ' + attribute.name + '=' + '"' + attribute.textContent + '"';
    }
  }

  static #addTextElementToBuild(element, buildInfo){
    const text = element.textContent.replace(/[\n\t\r]/g, '');

    let addingContent;
    if(element.nodeType === CDATA_SECTION_NODE) {
      addingContent = CDATA_SECTION_PREFIX + element.textContent + CDATA_SECTION_SUFFIX;
    } else if (element.nodeType === COMMENT_NODE) {
      addingContent = COMMENT_PREFIX + element.textContent + COMMENT_SUFFIX;
    } else{
      addingContent = text;
    }

    addingContent = addingContent.trim();

    if(buildInfo.textContentOnDifferentLine){
      addingContent = XmlBeautify.#getIndent(buildInfo) + addingContent + "\n";
    } else {
      addingContent += " ";
      if (buildInfo.xmlText.endsWith("\n")) {
        const idx = buildInfo.xmlText.lastIndexOf("\n");
        buildInfo.xmlText = buildInfo.xmlText.substring(0, idx);

      }
    }
    buildInfo.xmlText += addingContent;

    return buildInfo.textContentOnDifferentLine;
  }
}
