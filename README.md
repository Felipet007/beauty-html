# beauty-html 
[![npm version](https://badge.fury.io/js/beauty-html.svg)](https://badge.fury.io/js/beauty-html)

[comment]: <> ([![CircleCI]&#40;https://circleci.com/gh/riversun/xml-beautify/tree/master.svg?style=shield&#41;]&#40;https://circleci.com/gh/riversun/xml-beautify/tree/master&#41;)
[![codecov](https://codecov.io/gh/Felipet007/xml-beautify/graph/badge.svg)](https://codecov.io/gh/Felipet007/xml-beautify)
beauty-html - pretty-print text in HTML and XML formats.

It is licensed under [MIT license](https://opensource.org/licenses/MIT).

This is an upgraded version of xml beautify of Tom Misawa/riversun (https://github.com/riversun/xml-beautify.git)

# How to use?

```javascript
var beautifiedHTMLText = new BeautyHtml().beautify(srcHtmlText,
    {
        indent: "  ",  //indent pattern like white spaces
        useSelfClosingElement: true, //true:use self-closing element when empty element.
        textContentOnDifferentLine: false // false: will write all the text together with its tags and siblings. true: will make a different line for each text fragment
    });

```


## Example of result

 
[BEFORE] source XML
```XML
<?xml version="1.0" encoding="utf-8"?><example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>
    <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element><element message="We say hello at noon."/>
      <element message="We say good evening at night."/>
    </element>
    <element message="Thank" title="Chapter2">
      <element>value</element>
      <element></element><foo><![CDATA[ < > & ]]></foo>
    </element>
  </body>
</example>
```

[AFTER] beautified XML
```XML
<?xml version="1.0" encoding="utf-8"?>
<example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>
    <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning." />
      <element message="We say hello at noon." />
      <element message="We say good evening at night." />
    </element>
    <element message="Thank" title="Chapter2">
      <element>value</element>
      <element />
      <foo><![CDATA[ < > & ]]></foo>
    </element>
  </body>
</example>

```


# Install
## install via npm

```shell
npm install beauty-html
```

## use from CDN

```
<script src="https://cdn.jsdelivr.net/npm/xml-beautify@1.2.3/dist/BeautyHtml.js"></script>
```

# Demo
## demo on the web
https://felipet007.github.io/beauty-html.html

## demo on node.js

**clone this project and type**

```shell
git clone https://github.com/Felipet007/beauty-html.git
npm start
```

# Run on Browser

```html
<!DOCTYPE html>
<html lang="en">
<body>
<script src="https://cdn.jsdelivr.net/npm/xml-beautify@1.2.3/dist/BeautyHtml.js"></script>
<script>
    const srcXmlText = `<?xml version="1.0" encoding="utf-8"?><example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>
    <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element><element message="We say hello at noon."/>
      <element message="We say good evening at night."/>
    </element>
    <element message="Thank" title="Chapter2">
      <element>value</element>
      <element></element>
    </element>
  </body>
</example>`;

    const beautifiedXmlText = new BeautyHtml().beautify(srcXmlText);
    console.log(beautifiedXmlText);


</script>
</body>
</html>

```

# Run on Node.js

To run BeautyHtml on node.js, need to install an external DOMParser like as follows.

```
npm install xmldom 
```

And specify it as follows,

```javascript
new BeautyHtml({parser: DOMParser})
```

- Example for Node.js

```javascript
const BeautyHtml = require('beauty-html');
const { DOMParser } = require('xmldom');// When used in a node.js environment, DOMParser is needed.
const srcXmlText = `<?xml version="1.0" encoding="utf-8"?><example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>
    <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element><element message="We say hello at noon."/>
      <element message="We say good evening at night."/>
    </element>
    <element message="Thank" title="Chapter2">
      <element>value</element>
      <element></element>
    </element>
  </body>
</example>`;

const beautifiedXmlText = new BeautyHtml({ parser: DOMParser }).beautify(srcXmlText);
console.log(beautifiedXmlText);

```

# Problems with Beautify Angular

There are issues while using this library on angular components, this is due to DOMParser which don't like special characters used on Angular for data and event binding. For example: "[" or ")".

```
    <my-panel [expanded]="true" (click)="click()">
        <span>Hello</span>
    </my-panel>
```

In that cases, we recommend to replace all this character with a marker like __OPEN_PAR__ and replace it again after the beautifier process. Like this:

```
    <my-panel __OPEN_BRACKET__expanded__CLOSE_BRACKET__="true" __OPEN_PAR__click__CLOSE_PAR__="click()">
        <span>Hello</span>
    </my-panel>
```

Note that "click()" has not been replaced because DOMParser can read that when is inside a String Literal without problems.

With these replacements, the beautifier should work. As this is not an issue from this library (it's from the DOMParser), there is not a fix planned.