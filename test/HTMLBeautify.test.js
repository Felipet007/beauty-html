import XmlBeautify from '../src/XmlBeautify'

const { DOMParser } = require('@xmldom/xmldom');

describe('HTMLBeautify', () => {
    describe('beautify()', () => {
        test('default', () => {
            const srcXmlText = `<?xml version="1.0" encoding="utf-8"?><example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>
  <!-- Esto es un comentario -->
  MyText jijiji
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

            const beautifiedXmlText = new XmlBeautify().beautify(srcXmlText);
            expect(beautifiedXmlText).toBe(`<?xml version="1.0" encoding="utf-8"?>
<example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>
    <!-- Esto es un comentario -->MyText jijiji <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element>
      <element message="We say hello at noon."></element>
      <element message="We say good evening at night."></element>
    </element>
    <element message="Thank" title="Chapter2">
      <element>value</element>
      <element></element>
    </element>
  </body>
</example>
`);
        });

        test('default with external DOMParser', () => {
            const srcXmlText = `<?xml version="1.0" encoding="utf-8"?><example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>
  My Text jijiji
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

            const beautifiedXmlText = new XmlBeautify({ parser: DOMParser }).beautify(srcXmlText);
            expect(beautifiedXmlText).toBe(`<?xml version="1.0" encoding="utf-8"?>
<example version="2.0">
  <head>
    <title>Original Title</title>
  </head>
  <body>My Text jijiji <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element>
      <element message="We say hello at noon."></element>
      <element message="We say good evening at night."></element>
    </element>
    <element message="Thank" title="Chapter2">
      <element>value</element>
      <element></element>
    </element>
  </body>
</example>
`           );
        })

        test('default with content on separate lines', () => {
            const srcXmlText = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
                "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<body version="2.0">
  <head><?target instruction?><title>Original Title</title>
  </head>
  <body>
<!-- Esto es un comentario -->
  MyText jijiji
    <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element><element message="We say hello at noon."/>
      <element message="We say good evening at night."/>
    </element>
    <element message="Thank" title="Chapter2">
      <element>value</element>
      <element></element>
    </element>
  </body>
</body>`;
            const options = {"textContentOnDifferentLine": true}
            const beautifiedXmlText = new XmlBeautify().beautify(srcXmlText, options);
            expect(beautifiedXmlText).toBe(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<body version="2.0">
  <head>
    <?target instruction?>
    <title>
      Original Title
    </title>
  </head>
  <body>
    <!-- Esto es un comentario -->
    MyText jijiji
    <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element>
      <element message="We say hello at noon."></element>
      <element message="We say good evening at night."></element>
    </element>
    <element message="Thank" title="Chapter2">
      <element>
        value
      </element>
      <element></element>
    </element>
  </body>
</body>
`);
        });

        test('default with external DOMParser and content on separate lines', () => {
            const srcXmlText = `<?xml version="1.0" encoding="utf-8"?><example version="2.0">
  <head><?target instruction?><?xml version="1.0"                type="selfEnclosing"
                                                           encoding="UTF-8"?>
    <title>Original Title</title>
  </head>
  <body>
  My Text jijiji
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
            const options = {"textContentOnDifferentLine": true}
            const beautifiedXmlText = new XmlBeautify({ parser: DOMParser }).beautify(srcXmlText, options);
            expect(beautifiedXmlText).toBe(`<?xml version="1.0" encoding="utf-8"?>
<example version="2.0">
  <head>
    <?target instruction?>
    <?xml version="1.0" type="selfEnclosing"
      encoding="UTF-8"?>
    <title>
      Original Title
    </title>
  </head>
  <body>
    My Text jijiji
    <element message="Greeting" title="Chapter1">
      <element message="We say good morning in the morning."></element>
      <element message="We say hello at noon."></element>
      <element message="We say good evening at night."></element>
    </element>
    <element message="Thank" title="Chapter2">
      <element>
        value
      </element>
      <element></element>
    </element>
  </body>
</example>
`           );
        })
    })
});
