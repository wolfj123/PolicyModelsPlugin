import { expect } from 'chai';
import 'mocha';
import PolicyModelLibApi from '../src/services/PolicyModelLibApi';
import * as path from 'path';
import * as FS from 'fs';


const timeout = ms => {
	return new Promise(resolve => setTimeout(resolve, ms));
}
const sampleProjectPath: string = path.join(__dirname, "/../testFixture/parts");

describe('API Environment Tests', () => {
	
	let api: PolicyModelLibApi;
	beforeEach(() => {
		PolicyModelLibApi.buildInstance(sampleProjectPath, message => console.log(message));
		api = PolicyModelLibApi.getInstance();
	})

	afterEach(async () => {
		api._terminateProcess();
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

	it('should build environment - windows', async () => {
		const windowsPath = sampleProjectPath.replace(/\//g,"\\");
		PolicyModelLibApi.buildInstance(windowsPath, message => console.log(message));
		api = PolicyModelLibApi.getInstance();
		const succeeded = await api._buildEnvironment();
		expect(succeeded).to.be.true;
	});

	it('should failed build environment cause to wrong path', async () => {
		PolicyModelLibApi.buildInstance(sampleProjectPath + "wrongPath", message => console.log(message));
		api = PolicyModelLibApi.getInstance();
		const serverHasStarted = await api._startServer();
		expect(serverHasStarted).to.be.true;
		const modelHasLoaded = await api._loadModel();
		expect(modelHasLoaded).to.be.false;
	});

	it("test bad new model data ",async () => {
		const serverHasStarted = await api._startServer();
		expect(serverHasStarted).to.be.true;
		
		let okAns;
		await api._createNewModel("").
		catch( (rej: string) => {
			okAns =  rej.startsWith("Failed to create a new model");
		});

		expect(okAns).equal(true);

	});

	it("test new model creation", async ()=>{
		let newModelDir:string = path.join(process.cwd(),"Policy Model")
		let noEscapeDir: string = newModelDir.split('\\').join('\\\\');
		let params: string = `{"modelName":"Policy Model","modelPath":"${noEscapeDir}","dgFileName":"decision-graph.dg","psFileName":"policy-space.pspace","rootSlot":"DataTags","authors":[{"person":true,"name":"","contact":"","affiliation":""}]}`

		const serverHasStarted = await api._startServer();
		expect(serverHasStarted).to.be.true;
		
		let ans = await api._createNewModel(params).
		catch (rej => expect(true).to.be.false);

		//@ts-ignore
		expect(ans.startsWith(newModelDir)).to.be.true;

	})

});