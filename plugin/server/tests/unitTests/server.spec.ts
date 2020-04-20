//import { getInitialCompleteItems, getCompleteItemsAdditionalInformation} from '../../src/LanguageService';
import 'mocha';
import { expect } from 'chai';

describe('auto complete test', () => {


  // it('should contain known policy langauge words', () => {
  //   const initalCompleteItems = getInitialCompleteItems();
  //   const expectedLabels=['PolicyModels','DecisionGraph','PolicySpace'];
  //   const isContainLabel = label => initalCompleteItems.some(item => item.label === label);
  //   expect(expectedLabels.every(isContainLabel)).to.be.true;
  // });

  // it('should add descriptions for known policy langauge words', () => {
  //   const initalCompleteItems = getInitialCompleteItems();
  //   const fullCompleteItems = initalCompleteItems.map(getCompleteItemsAdditionalInformation);
  //   const expectedInfo=[
  //     {
  //       label: 'PolicyModels',
  //       kind: 1,
  //       data: 1,
  //       detail: 'PolicyModels details',
  //       documentation: 'PolicyModels documentation'
  //     },
  //     {
  //       label: 'DecisionGraph',
  //       kind: 1,
  //       data: 2,
  //       detail: 'DecisionGraph details',
  //       documentation: 'DecisionGraph documentation'
  //     },
  //     {
  //       label: 'PolicySpace',
  //       kind: 1,
  //       data: 3,
  //       detail: 'PolicySpace details',
  //       documentation: 'PolicySpace documentation'
  //     }
  //   ];
  //   expect(fullCompleteItems).to.deep.equal(expectedInfo);
  // });

});