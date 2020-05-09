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



describe('Building files structure', () => {

  it('should build localizations files with simple data', () => {
    mock(
      {
        languages: {
          language1: {
            'answers.txt': filecontent('answer.txt'),
            'space.md': filecontent('space.md'),
          }
        },
      },
      { createCwd: true, createTmp: true }
    );

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

  it('should build localizations files with complex data', () => {
    mock(
      {
        'languages': {
          'language1': {
            'answers.txt': filecontent('answer.txt'),
            'space.md': filecontent('space.md'),
            'nodes':{
              'folder1':{
                'file1.md': filecontent('file1.md')
              },
              'folder2':{
                'file2.md': filecontent('file2.md')
              }
            }
          },
          'language2': {
            'answers.txt': filecontent('answer.txt'),
            'space.md': filecontent('space.md'),
            'nodes':{
              'folder1':{
                'file1.md': filecontent('file1.md')
              },
              'folder2':{
                'file2.md': filecontent('file2.md')
              }
            }
          },
        },
      },
      { createCwd: true, createTmp: true }
    );

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
          id: './languages/language1/nodes/folder1/file1.md',
          name: 'file1.md',
          path: './languages/language1/nodes/folder1/file1.md',
          extension: '.md',
          content: filecontent('file1.md'),
        },
        {
          id: './languages/language1/nodes/folder2/file2.md',
          name: 'file2.md',
          path: './languages/language1/nodes/folder2/file2.md',
          extension: '.md',
          content: filecontent('file2.md'),
        },
        {
          id: './languages/language1/space.md',
          name: 'space.md',
          path: './languages/language1/space.md',
          extension: '.md',
          content: filecontent('space.md'),
        },
      ],
    },
    {
      language: 'language2',
      files: [
        {
          id: './languages/language2/answers.txt',
          name: 'answers.txt',
          path: './languages/language2/answers.txt',
          extension: '.txt',
          content: filecontent('answer.txt'),
        },
        {
          id: './languages/language2/nodes/folder1/file1.md',
          name: 'file1.md',
          path: './languages/language2/nodes/folder1/file1.md',
          extension: '.md',
          content: filecontent('file1.md'),
        },
        {
          id: './languages/language2/nodes/folder2/file2.md',
          name: 'file2.md',
          path: './languages/language2/nodes/folder2/file2.md',
          extension: '.md',
          content: filecontent('file2.md'),
        },
        {
          id: './languages/language2/space.md',
          name: 'space.md',
          path: './languages/language2/space.md',
          extension: '.md',
          content: filecontent('space.md'),
        },
      ],
    }];
    const files = localizationController.getLanguagesFilesData();
    expect(files.length).to.equal(expectedFiles.length);
    for (var i = 0; i < files.length; i++) {
      expect(files[i].language).to.equal(expectedFiles[i].language);
      expect(expectedFiles[i].files).to.have.deep.members(files[i].files);
    }
  });

  it('should filter unsuported extension', () => {
    mock(
      {
        languages: {
          language1: {
            'answers.txt': filecontent('answer.txt'),
            'space.md': filecontent('space.md'),
            'file.unsupportedExtension': filecontent('file.unsupportedExtension'),
          }
        },
      },
      { createCwd: true, createTmp: true }
    );
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
      ]}
      ];
      const files = localizationController.getLanguagesFilesData();
      expect(expectedFiles).to.deep.equal(files);

  });

});

describe('Editing localization files', () => {
beforeEach(()=>{
  mock(
    {
      languages: {
        language1: {
          'answers.txt': filecontent('answer.txt'),
          'space.md': filecontent('space.md'),
        }
      },
    },
    { createCwd: true, createTmp: true }
  );
})

  it('should save file',()=>{
    const newContent = 'newContent';

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
          content: newContent,
        },
      ],
    }];

    const newFiles = localizationController.onSaveFile('./languages/language1/space.md',newContent);
    expect(expectedFiles).to.deep.equal(newFiles);
  });

  it('should failed on saving file with wrong path',()=>{
    const newContent = 'newContent';
    const unFamillierPath = './someWrongPath';
    try{
    const newFiles = localizationController.onSaveFile(unFamillierPath,newContent);
    expect(false).true;
    }catch(e){
      expect(true).true;
    }

  });
});


