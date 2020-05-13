import { expect } from 'chai';
import 'mocha';
import {PolicyModelLibApi} from '../src/services/PolicyModelLibApi';



describe('API Tests', () => {

  it('should build enviroment', () => {
				const api: PolicyModelLibApi = new PolicyModelLibApi("path");
				api._buildEnviroment();
				expect(true).to.be.true;

	});

});