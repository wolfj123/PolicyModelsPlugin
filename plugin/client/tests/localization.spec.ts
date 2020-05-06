import { expect } from 'chai';
import * as mock from 'mock-fs';
import LocalizationController from '../src/Localization/LocalizationController';
import { LanguageData, File } from '../src/view/Types/model';
import 'mocha';

const rootPath = '.';
const filecontent = fileName => fileName + 'file content';
let localizationController;

before(() => {
  localizationController = new LocalizationController({}, rootPath, e => {
    throw Error(e);
  });


});



after(() => {
  mock.restore();
});



describe('Files structure', () => {

  beforeEach(() => {
    mock(
      {
        languages: {
          language1: {
            'answers.txt': filecontent('answer.txt'),
            'space.md': filecontent('space.md'),
          },
        },
      },
      { createCwd: true, createTmp: true }
    );
  });

  it('should build localizations files data', () => {
    const expectedFiles: LanguageData[] =[ {
      language: 'language1',
      files: [
        {
          id: './languages/language1/answers.txt',
          name: 'answers.txt',
          path: './languages/language1/answers.txt',
          extension: '.txt',
          content: filecontent('answer.txt'),
        },
        {
          id: './languages/language1/space.md',
          name: 'space.md',
          path: './languages/language1/space.md',
          extension: '.md',
          content: filecontent('space.md'),
        },
      ],
    }];
    const files = localizationController.getLanguagesFilesData();
    expect(expectedFiles).to.deep.equal(files);
  });


});
