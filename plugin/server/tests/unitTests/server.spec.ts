import { getInitialCompleteItems } from '../../src/LanguageService';
import 'mocha';
import { expect } from 'chai';

describe('auto complete test', () => {


  it('should contain basic policy langauge words', () => {
    const initalCompleteItems = getInitialCompleteItems();
    const expectedLabels=['PolicyModels','DecisionGraph','PolicySpace'];
    const isContainLabel = label => initalCompleteItems.some(item => item.label === label);
    expect(expectedLabels.every(isContainLabel)).to.be.true;
  });

});