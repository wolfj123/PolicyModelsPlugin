public class LoadModelHandler extends PolicyModelHttpHandler {

    @Override
    public String handleGetRequest(String params) throws Exception {
        String path = params;
        return PolicyModelService.loadPolicyModel(path);
    }

    @Override
    public String handlePostRequest(String params) {
        return null;
    }
}