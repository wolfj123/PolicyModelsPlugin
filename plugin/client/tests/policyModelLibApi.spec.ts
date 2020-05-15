import { expect } from 'chai';
import 'mocha';
import { PolicyModelLibApi } from '../src/services/PolicyModelLibApi';
import * as path from 'path';


const timeout = ms =>  {
	return new Promise(resolve => setTimeout(resolve, ms));
}
const sampleProjectPath: string = path.join(__dirname, "/../testFixture/parts");

describe('API Tests', () => {

	let api: PolicyModelLibApi;
	beforeEach(()=>{
	api = new PolicyModelLibApi(sampleProjectPath, message => console.log(message));
	})

	afterEach(async () => {
		api.terminateProcess();
		await timeout(500);
	})

	it('should start server', async () => {
		const serverHasStarted = await api._startServer();
		expect(serverHasStarted).to.be.true;
	});

	it('should build environment', async () => {
		const succeeded = await api._buildEnvironment();
		expect(succeeded).to.be.true;
	});

	it('should failed build environment cause to wrong path', async () => {
		api = new PolicyModelLibApi(sampleProjectPath+"wrongPath", message => console.log(message));
		const serverHasStarted = await api._startServer();
		expect(serverHasStarted).to.be.true;
		const modelHasLoaded = await api._loadModel();
		expect(modelHasLoaded).to.be.false;
	});

});