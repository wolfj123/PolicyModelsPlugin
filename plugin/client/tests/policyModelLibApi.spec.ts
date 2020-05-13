import { expect } from 'chai';
import 'mocha';
import {PolicyModelLibApi} from '../src/services/PolicyModelLibApi';



describe('API Tests', () => {

  it('should build environment', () => {
				const api: PolicyModelLibApi = new PolicyModelLibApi("/Users/ofirb/Desktop/University/Final_Project/PolicyModelsPlugin/plugin/client/testFixture/partss");
				api._buildEnvironment();
				expect(true).to.be.true;

	});

});