"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const mockFs = require("mock-fs");
const logger_1 = require("./logger/logger");
const template_1 = require("./template");
const template_2 = require("./template");
describe('template', () => {
    describe('inlineTemplate', () => {
        it('should inline multiple external html files which are the same for multiple @Components in same .ts file', () => {
            const sourceText = '/*someprefix*/@Component({templateUrl: "some-file.html" });/*somebetween*/@Component({templateUrl: "some-file.html" })/*somesuffix*/';
            const baseDir = path_1.join(process.cwd(), 'path', 'to', 'dir');
            const d = {};
            d[baseDir] = {
                'some-file.html': '<div>A</div>',
                'some-file.scss': 'body { color: red; }',
                'some-file.ts': sourceText,
            };
            mockFs(d);
            const results = template_1.inlineTemplate(sourceText, path_1.join(baseDir, 'some-file.ts'));
            expect(results).toEqual(`/*someprefix*/@Component({template:/*ion-inline-start:"${path_1.join(baseDir, 'some-file.html')}"*/\'<div>A</div>\'/*ion-inline-end:"${path_1.join(baseDir, 'some-file.html')}"*/ });/*somebetween*/@Component({template:/*ion-inline-start:"${path_1.join(baseDir, 'some-file.html')}"*/\'<div>A</div>\'/*ion-inline-end:"${path_1.join(baseDir, 'some-file.html')}"*/ })/*somesuffix*/`);
            mockFs.restore();
        });
        it('should inline multiple external html files with multiple @Components in same .ts file', () => {
            const sourceText = '/*someprefix*/@Component({templateUrl: "some-file1.html" });/*somebetween*/@Component({templateUrl: "some-file2.html" })/*somesuffix*/';
            const baseDir = path_1.join(process.cwd(), 'path', 'to', 'dir');
            const d = {};
            d[baseDir] = {
                'some-file1.html': '<div>A</div>',
                'some-file2.html': '<div>B</div>',
                'some-file.scss': 'body { color: red; }',
                'some-file.ts': sourceText,
            };
            mockFs(d);
            const results = template_1.inlineTemplate(sourceText, path_1.join(baseDir, 'some-file.ts'));
            expect(results).toEqual(`/*someprefix*/@Component({template:/*ion-inline-start:"${path_1.join(baseDir, 'some-file1.html')}"*/\'<div>A</div>\'/*ion-inline-end:"${path_1.join(baseDir, 'some-file1.html')}"*/ });/*somebetween*/@Component({template:/*ion-inline-start:"${path_1.join(baseDir, 'some-file2.html')}"*/\'<div>B</div>\'/*ion-inline-end:"${path_1.join(baseDir, 'some-file2.html')}"*/ })/*somesuffix*/`);
            mockFs.restore();
        });
        it('should inline the external html file content', () => {
            const sourceText = '@Component({templateUrl: "some-file.html" })';
            const baseDir = path_1.join(process.cwd(), 'path', 'to', 'dir');
            const d = {};
            d[baseDir] = {
                'some-file.html': '<div>hello</div>',
                'some-file.scss': 'body { color: red; }',
                'some-file.ts': sourceText,
            };
            mockFs(d);
            const results = template_1.inlineTemplate(sourceText, path_1.join(baseDir, 'some-file.ts'));
            expect(results).toEqual(`@Component({template:/*ion-inline-start:"${path_1.join(baseDir, 'some-file.html')}"*/\'<div>hello</div>\'/*ion-inline-end:"${path_1.join(baseDir, 'some-file.html')}"*/ })`);
            mockFs.restore();
        });
        it('should do nothing for files with incomplete Component', () => {
            const sourceText = `
        // Component this be bork
      `;
            const sourcePath = 'somefile.ts';
            const output = template_1.inlineTemplate(sourceText, sourcePath);
            expect(output).toEqual(sourceText);
        });
        it('should do nothing for files without Component', () => {
            const sourceText = `
        console.log('yeah nothing');
      `;
            const sourcePath = 'somefile.ts';
            const output = template_1.inlineTemplate(sourceText, sourcePath);
            expect(output).toEqual(sourceText);
        });
    });
    describe('updateTemplate', () => {
        it('should load and replace html file content', () => {
            const d = {
                'path/to/dir': {
                    'some-file.html': '<div>hello</div>',
                    'some-file.scss': 'body { color: red; }',
                    'some-file.ts': '@Component({templateUrl: "some-file.html" })',
                },
            };
            mockFs(d);
            const match = template_2.getTemplateMatch(d['path/to/dir']['some-file.ts']);
            const expected = template_1.replaceTemplateUrl(match, 'path/to/dir/some-file.html', '<div>hello</div>');
            const results = template_1.updateTemplate('path/to/dir', match);
            expect(results).toEqual(expected);
            mockFs.restore();
        });
        it('should load null for unfound html file content', () => {
            const d = {
                'path/to/dir': {
                    'some-file.html': '<div>hello</div>',
                    'some-file.scss': 'body { color: red; }',
                    'some-file.ts': '@Component({templateUrl: "some-file-doesnt-exist.html" })',
                },
            };
            mockFs(d);
            const match = template_2.getTemplateMatch(d['path/to/dir']['some-file.ts']);
            const results = template_1.updateTemplate('path/to/dir', match);
            expect(results).toEqual(null);
            mockFs.restore();
        });
    });
    describe('replaceTemplateUrl', () => {
        it('should turn the template into one line', () => {
            const str = `
        Component({
          templateUrl: "somepage.html"})`;
            const templateContent = `
        <div>\t
          this is "multiline" 'content'
        </div>\r
      `;
            const htmlFilePath = path_1.join(process.cwd(), 'full', 'path', 'to', 'somepage.html');
            const match = template_2.getTemplateMatch(str);
            const result = template_1.replaceTemplateUrl(match, htmlFilePath, templateContent);
            const expected = `Component({template:/*ion-inline-start:"${path_1.join(process.cwd(), 'full', 'path', 'to', 'somepage.html')}"*/\'\\n        <div>\t\\n          this is "multiline" \\'content\\'\\n        </div>\\n\\n      \'/*ion-inline-end:"${path_1.join(process.cwd(), 'full', 'path', 'to', 'somepage.html')}"*/})`;
            expect(result).toEqual(expected);
        });
    });
    describe('getTemplateFormat', () => {
        it('should resolve the path', () => {
            const path = 'some/crazy/path/my.html';
            const resolvedPath = path_1.resolve(path);
            const results = template_2.getTemplateFormat(path, 'filibuster');
            expect(path).not.toEqual(resolvedPath);
            expect(results).toEqual(`template:/*ion-inline-start:"${resolvedPath}"*/\'filibuster\'/*ion-inline-end:"${resolvedPath}"*/`);
        });
    });
    describe('replaceBundleJsTemplate', () => {
        it('should replace already inlined template with new content', () => {
            const htmlFilePath = 'c:\\path/to\some/crazy:thing.html;';
            const oldContent = 'some old content';
            const tmplate = template_2.getTemplateFormat(htmlFilePath, oldContent);
            const bundleSourceText = `
        @Component({
          selector: 'yo-div',
          /*blah*/${tmplate}/*derp*/
        })
        @Component({
          selector: 'yo-div2',
          /*222*/${tmplate}/*2222*/
        })
      `;
            const newContent = 'some new content';
            const output = template_2.replaceExistingJsTemplate(bundleSourceText, newContent, htmlFilePath);
            expect(output.indexOf(newContent)).toBeGreaterThan(-1);
            expect(output.indexOf(newContent)).toBeGreaterThan(-1);
        });
    });
    describe('COMPONENT_REGEX match', () => {
        it('should get Component with template url and selector above', () => {
            const str = `
        Component({
          selector: 'page-home',
          templateUrl: 'home.html'
        })
      `;
            const match = template_2.getTemplateMatch(str);
            expect(match.templateUrl).toEqual('home.html');
        });
        it('should get Component with template url and selector below', () => {
            const str = `
        Component({
          templateUrl: 'home.html',
          selector: 'page-home
        })
      `;
            const match = template_2.getTemplateMatch(str);
            expect(match.templateUrl).toEqual('home.html');
        });
        it('should get Component with template url, spaces, tabs and new lines', () => {
            const str = `\t\n\r
        Component(
          {

            templateUrl :
              \t\n\r"c:\\some\windows\path.ts"

          }
        )
      `;
            const match = template_2.getTemplateMatch(str);
            expect(match.templateUrl).toEqual('c:\\some\windows\path.ts');
        });
        it('should get Component with template url and spaces', () => {
            const str = '  Component  (  {  templateUrl  :  `  hi  `  }  )  ';
            const match = template_2.getTemplateMatch(str);
            expect(match.component).toEqual('Component  (  {  templateUrl  :  `  hi  `  }  )');
            expect(match.templateProperty).toEqual('  templateUrl  :  `  hi  `');
            expect(match.templateUrl).toEqual('hi');
        });
        it('should get Component with template url and back-ticks', () => {
            const str = 'Component({templateUrl:`hi`})';
            const match = template_2.getTemplateMatch(str);
            expect(match.component).toEqual('Component({templateUrl:`hi`})');
            expect(match.templateProperty).toEqual('templateUrl:`hi`');
            expect(match.templateUrl).toEqual('hi');
        });
        it('should get Component with template url and double quotes', () => {
            const str = 'Component({templateUrl:"hi"})';
            const match = template_2.getTemplateMatch(str);
            expect(match.component).toEqual('Component({templateUrl:"hi"})');
            expect(match.templateProperty).toEqual('templateUrl:"hi"');
            expect(match.templateUrl).toEqual('hi');
        });
        it('should get Component with template url and single quotes', () => {
            const str = 'Component({templateUrl:\'hi\'})';
            const match = template_2.getTemplateMatch(str);
            expect(match.component).toEqual('Component({templateUrl:\'hi\'})');
            expect(match.templateProperty).toEqual('templateUrl:\'hi\'');
            expect(match.templateUrl).toEqual('hi');
        });
        it('should get null for Component without string for templateUrl', () => {
            const str = 'Component({templateUrl:someVar})';
            const match = template_2.getTemplateMatch(str);
            expect(match).toEqual(null);
        });
        it('should get null for Component without templateUrl', () => {
            const str = 'Component({template:"hi"})';
            const match = template_2.getTemplateMatch(str);
            expect(match).toEqual(null);
        });
        it('should get null for Component without brackets', () => {
            const str = 'Component()';
            const match = template_2.getTemplateMatch(str);
            expect(match).toEqual(null);
        });
        it('should get null for Component without parentheses', () => {
            const str = 'Component';
            const match = template_2.getTemplateMatch(str);
            expect(match).toEqual(null);
        });
        it('should get null for Component({})', () => {
            const str = 'Component';
            const match = template_2.getTemplateMatch(str);
            expect(match).toEqual(null);
        });
        it('should get null for no Component', () => {
            const str = 'whatever';
            const match = template_2.getTemplateMatch(str);
            expect(match).toEqual(null);
        });
    });
    const oldLoggerError = logger_1.Logger.error;
    logger_1.Logger.error = function () { };
    afterAll(() => {
        logger_1.Logger.error = oldLoggerError;
    });
});
