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
 *       const resultXmlText = new BeautyHtml().beautify(textInput.value,
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
const PROCESSING_INSTRUCTION_PREFIX = '<?';
const PROCESSING_INSTRUCTION_SUFFIX = '?>';
const DOCTYPE_PREFIX = '<!DOCTYPE';
const DOCTYPE_PUBLIC_TAG = 'PUBLIC';
const DOCTYPE_SUFFIX = END_TAG_SUFFIX;

const WHITE_SPACE = ' ';
const LINE_BREAK = '\n';
const DOUBLE_QUOTE = '"';
const EMPTY = '';

export default class BeautyHtml {
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
      xmlText: EMPTY,
      useSelfClosingElement: !!data.useSelfClosingElement,
      indentLevel: 0,
      textContentOnDifferentLine: !!data.textContentOnDifferentLine
    }

    const doc = this.parser.parseFromString(xmlText, 'text/xml');

    if (!this.userExternalParser && BeautyHtml.#hasXmlDefinition(xmlText)) {
      BeautyHtml.#addXmlDefinition(xmlText, buildInfo);
    }

    const roots = this.userExternalParser? BeautyHtml.#getChildren(doc) : doc.childNodes;
    for(const root of roots){
      BeautyHtml.#parse(root, buildInfo, this.userExternalParser);
    }

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
    || BeautyHtml.#isContentNode(nodeType)
    || BeautyHtml.#isDescriptorNode(nodeType);
  }

  static #isContentNode(nodeType){
    return nodeType === TEXT_NODE
    || nodeType === CDATA_SECTION_NODE;
  }

  static #isDescriptorNode(nodeType){
    return nodeType === COMMENT_NODE
        || nodeType === PROCESSING_INSTRUCTION_NODE
        || nodeType === DOCUMENT_TYPE_NODE;
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
  static #getChildren(element) {
      const children = [];

      if(element.childNodes) {
        for (let i = 0; i < element.childNodes.length; i++) {
          if (BeautyHtml.#isIndentNode(element.childNodes[i].nodeType)) {
            children.push(element.childNodes[i]);
          }
        }
      }
      return children;
  }

  static #getIndent(buildInfo, plusIndentLevel=0){
    const indentLevel = buildInfo.indentLevel + plusIndentLevel;

    let indentText = EMPTY;
    for (let idx = 0; idx < indentLevel; idx++) {
      indentText += buildInfo.indentText;
    }
    return indentText;
  }

  static #parse(element, buildInfo, userExternalParser, nextSiblingNeedsIndent = true){
    if(element.nodeType === ELEMENT_NODE) {
      BeautyHtml.#addNodeElementToBuild(element, buildInfo, userExternalParser, nextSiblingNeedsIndent);
    } else if (BeautyHtml.#isDescriptorNode(element.nodeType)){
      BeautyHtml.#addDescriptorElementToBuild(element, buildInfo);
    } else if(BeautyHtml.#isContentNode(element.nodeType) && BeautyHtml.#hasContent(element)){
      return BeautyHtml.#addTextElementToBuild(element, buildInfo);
    }
    return true;
  }

  static #addNodeElementToBuild(element, buildInfo, userExternalParser, needsIndent) {
    let elementTextContent = element.textContent || EMPTY;

    const blankReplacedElementContent = elementTextContent.replace(/[ \r\n\t]/g, EMPTY);

    if (blankReplacedElementContent.length === 0) {
      elementTextContent = EMPTY;
    }

    const elementHasNoChildren = userExternalParser? !(BeautyHtml.#getChildren(element).length > 0) : !(element.childNodes.length > 0);
    const elementHasValueOrChildren = (elementTextContent && elementTextContent.length > 0);
    const isEmptyElement = elementHasNoChildren && !elementHasValueOrChildren;
    const useSelfClosingElement = buildInfo.useSelfClosingElement;

    if(needsIndent)
      buildInfo.xmlText += BeautyHtml.#getIndent(buildInfo);

    buildInfo.xmlText += START_TAG_PREFIX + element.tagName

    if(element.attributes)
      BeautyHtml.#addAttributesOfElement(element, buildInfo);

    buildInfo.xmlText += isEmptyElement && useSelfClosingElement? EMPTY_TAG_SUFFIX : START_TAG_SUFFIX;

    if (!isEmptyElement || useSelfClosingElement) {
        buildInfo.xmlText += LINE_BREAK;
    }

    buildInfo.indentLevel++;

    const childrenNodes = userExternalParser? BeautyHtml.#getChildren(element) : element.childNodes;
    let closingNeedsIndent = true;
    for (const child of childrenNodes) {
      closingNeedsIndent = BeautyHtml.#parse(child, buildInfo, userExternalParser, closingNeedsIndent);
    }
    buildInfo.indentLevel--;
    buildInfo.xmlText = buildInfo.xmlText.replace(/ *$/g, EMPTY);

    if(!isEmptyElement && !(elementHasNoChildren && elementHasValueOrChildren) && closingNeedsIndent){
        buildInfo.xmlText += BeautyHtml.#getIndent(buildInfo);
    }

    if ((isEmptyElement && !useSelfClosingElement) || !isEmptyElement) {
        const endTag = END_TAG_PREFIX + element.tagName + END_TAG_SUFFIX;
        buildInfo.xmlText += endTag;
        buildInfo.xmlText += LINE_BREAK;
    }
  };

  static #addAttributesOfElement(element, buildInfo){
    for(let idx = 0; idx<element.attributes.length; idx++){
      const attribute = element.attributes[idx];
      buildInfo.xmlText += WHITE_SPACE + attribute.name + '=' + DOUBLE_QUOTE + attribute.textContent + DOUBLE_QUOTE;
    }
  }

  static #addTextElementToBuild(element, buildInfo){
    const text = element.textContent.replace(/[\n\t\r]/g, EMPTY);

    let addingContent;
    if(element.nodeType === CDATA_SECTION_NODE) {
      addingContent = CDATA_SECTION_PREFIX + element.textContent + CDATA_SECTION_SUFFIX;
    } else {
      addingContent = text;
    }

    addingContent = addingContent.trim();

    if(buildInfo.textContentOnDifferentLine){
      addingContent = BeautyHtml.#getIndent(buildInfo) + addingContent + LINE_BREAK;
    } else {
      addingContent += WHITE_SPACE;
      if (buildInfo.xmlText.endsWith(LINE_BREAK)) {
        const idx = buildInfo.xmlText.lastIndexOf(LINE_BREAK);
        buildInfo.xmlText = buildInfo.xmlText.substring(0, idx);

      }
    }
    buildInfo.xmlText += addingContent;

    return buildInfo.textContentOnDifferentLine;
  }

  static #addDescriptorElementToBuild(element, buildInfo){
    let addingContent;
    if (element.nodeType === COMMENT_NODE) {
      addingContent = COMMENT_PREFIX + element.textContent + COMMENT_SUFFIX;
    } else if (element.nodeType === PROCESSING_INSTRUCTION_NODE){
      let elementValue = element.data;
      elementValue = BeautyHtml.#clean(elementValue, buildInfo);
      addingContent = PROCESSING_INSTRUCTION_PREFIX + element.target + WHITE_SPACE + elementValue + PROCESSING_INSTRUCTION_SUFFIX;
    } else if (element.nodeType === DOCUMENT_TYPE_NODE){ //DOCUMENT DEFINITION
      addingContent = DOCTYPE_PREFIX + WHITE_SPACE + element.name;
      addingContent += !element.publicId? EMPTY : WHITE_SPACE + DOCTYPE_PUBLIC_TAG + WHITE_SPACE
                                              + DOUBLE_QUOTE + element.publicId + DOUBLE_QUOTE
                                              + LINE_BREAK + BeautyHtml.#getIndent(buildInfo, 1)
                                              + DOUBLE_QUOTE + element.systemId + DOUBLE_QUOTE;
      addingContent += DOCTYPE_SUFFIX;
    }

    addingContent = BeautyHtml.#getIndent(buildInfo) + addingContent + LINE_BREAK;
    buildInfo.xmlText += addingContent;

    return buildInfo.textContentOnDifferentLine;
  }

  static #addXmlDefinition(xmlText, buildInfo){
    const encoding = BeautyHtml.#getEncoding(xmlText) || 'UTF-8';
    const xmlHeader = '<?xml version="1.0" encoding="' + encoding + '"?>';
    buildInfo.xmlText += xmlHeader + LINE_BREAK;
  }

  static #clean(elementValue, buildInfo){
    const whiteSpaceReplaceRegex = / +/g;
    const tabSpaceReplaceRegex = /\t+/g;
    const lineBreakReplaceRegex = /[\n\r]+ */g;

    const indentForLineBreaks = BeautyHtml.#getIndent(buildInfo, 1);

    return elementValue.replace(tabSpaceReplaceRegex, EMPTY)
        .replace(whiteSpaceReplaceRegex, WHITE_SPACE)
        .replace(lineBreakReplaceRegex, LINE_BREAK + indentForLineBreaks);
  }
}
